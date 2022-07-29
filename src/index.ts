import * as dotenv from 'dotenv';
import { createWebhookModule, sipgateIO, WebhookResponse } from 'sipgateio';
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
  console.error('ERROR: You need to set the service phones!\n');
  process.exit();
}

if (!process.env.CENTRAL_SERVICE_PHONE) {
  console.error('ERROR: You need to set the central phonenumber!\n');
  process.exit();
}

const serverAddress: string = process.env.SIPGATE_WEBHOOK_SERVER_ADDRESS;
const hostname: string = process.env.DATABASE_HOST || 'localhost';
const serviceTeamNumbers: string[] = process.env.SERVICE_PHONES.split(','); // all active phones
const centralPhone: string = process.env.CENTRAL_SERVICE_PHONE || '';

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

      if (newCallEvent.from === centralPhone) {
        return WebhookResponse.playAudio({
          announcement: 'https://static.sipgate.com/examples/wav/example.wav',
          // announcement: 'https://github.com/sipgate-io/sipgateio-intelligent-routing/blob/main/res/redirect.wav?raw=true'
        });
      }

      const redirectNumber = await getRedirectNumber(
        newCallEvent.from,
        db,
        serviceTeamNumbers,
      );

      return WebhookResponse.redirectCall({
        anonymous: true,
        numbers: [redirectNumber],
      });
    });

    webhookServer.onAnswer(async (newAnswerEvent) => {
      // ignore answerEvents from central phone
      if (newAnswerEvent.from !== centralPhone) {
        console.log(
          `New answer: ${newAnswerEvent.from} by ${newAnswerEvent.answeringNumber}`,
        );
        await db
          .createQueryBuilder()
          .insert()
          .into(CallHistory)
          .values([
            {
              customerPhone: newAnswerEvent.from,
              servicePhone: newAnswerEvent.answeringNumber,
            },
          ])
          .execute();
      }
    });
  });

export default CallHistory;
