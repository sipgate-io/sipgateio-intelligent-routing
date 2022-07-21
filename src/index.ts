import * as dotenv from 'dotenv';
import { WebhookResponse, createWebhookModule } from 'sipgateio';
import getRandomIntInRange from './util';

dotenv.config();

const port = 8080;

if (!process.env.SIPGATE_WEBHOOK_SERVER_ADDRESS) {
  console.error(
    'ERROR: You need to set a server address for the followup webhook events!\n',
  );
  process.exit();
}

if (!process.env.CENTRAL_SERVICE_PHONE || !process.env.SERVICE_PHONES) {
  console.error(
    'ERROR: You need to set the redirect phonenumber and the service phones!\n',
  );
  process.exit();
}

const serverAddress: string = process.env.SIPGATE_WEBHOOK_SERVER_ADDRESS;
const hostname: string = process.env.HOSTNAME || 'localhost';
const centralServiceNumber: string = process.env.CENTRAL_SERVICE_PHONE;
const serviceTeamNumbers: string[] = process.env.SERVICE_PHONES.split(',');

const webhookModule = createWebhookModule();
webhookModule
  .createServer({
    port,
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

    webhookServer.onNewCall((newCallEvent) => {
      console.log(`New call from ${newCallEvent.from} to ${newCallEvent.to}`);

      console.log('Redirecting...');

      const redirectnumber: string =
        serviceTeamNumbers[getRandomIntInRange(serviceTeamNumbers.length)];

      return WebhookResponse.redirectCall({
        anonymous: true,
        numbers: [redirectnumber],
      });
    });
  });
