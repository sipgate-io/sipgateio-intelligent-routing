import * as dotenv from 'dotenv';
import { createWebhookModule, WebhookResponse } from 'sipgateio';
import { CallHistory, db } from './db';
import getRedirectNumber from './logic';

dotenv.config();

if (!process.env.SIPGATE_WEBHOOK_SERVER_ADDRESS) {
  console.error(
    'ERROR: You need to set a server address for the followup webhook events!\n',
  );
  process.exit();
}

if (!process.env.SERVICE_PHONES) {
  console.error(
    'ERROR: You need to set the redirect phonenumber and the service phones!\n',
  );
  process.exit();
}

const serverAddress: string = process.env.SIPGATE_WEBHOOK_SERVER_ADDRESS;
const hostname: string = process.env.DATABASE_HOST || 'localhost';
const serviceTeamNumbers: string[] = process.env.SERVICE_PHONES.split(',');

db.initialize().then(async () => {
  console.log('Database initialized 🗃️');
  db.synchronize();
});

const webhookModule = createWebhookModule();
webhookModule
  .createServer({
    port: 8080,
    serverAddress,
    hostname,
  })
  .then((webhookServer) => {
    console.log(
      `Server running at ${serverAddress}\n` +
        'Please set this URL for incoming calls at https://console.sipgate.com/webhooks/urls\n' +
        "ProTip: To see how to do that automatically, check out the example at 'examples/settings/settings_set_url_incoming.ts'\n" +
        'Ready for calls 📞',
    );

    webhookServer.onNewCall(async (newCallEvent) => {
      console.log(`New call from ${newCallEvent.from} to ${newCallEvent.to}`);

      const redirectnumber = await getRedirectNumber(
        newCallEvent.from,
        db,
        serviceTeamNumbers,
      );

      return WebhookResponse.redirectCall({
        anonymous: true,
        numbers: [redirectnumber],
      });
    });

    webhookServer.onHangUp(async (newHangupEvent) => {
      console.log(
        `New hangup from ${newHangupEvent.from} to ${newHangupEvent.to} (call was redirected to: ${newHangupEvent.answeringNumber})`,
      );

      if (newHangupEvent.answeringNumber) {
        await db
          .createQueryBuilder()
          .insert()
          .into(CallHistory)
          .values([
            {
              customerPhone: newHangupEvent.from,
              servicePhone: newHangupEvent.answeringNumber,
            },
          ])
          .execute();
      }
    });
  });

export default CallHistory;
