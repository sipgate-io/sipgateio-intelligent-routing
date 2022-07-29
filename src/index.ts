import * as dotenv from 'dotenv';
import { createWebhookModule, sipgateIO, WebhookResponse } from 'sipgateio';
import { CallHistory, db } from './db';
import { respondToNewCall, respondToOnAnswer } from './logic';

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

    webhookServer.onNewCall(async (newCallEvent) => respondToNewCall(
        newCallEvent,
        centralPhone,
        db,
        serviceTeamNumbers,
      ));

    webhookServer.onAnswer(async (newAnswerEvent) => respondToOnAnswer(newAnswerEvent, centralPhone, db));
  });

export default CallHistory;
