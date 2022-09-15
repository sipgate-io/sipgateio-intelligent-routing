import * as dotenv from 'dotenv';
import {
  createDevicesModule,
  createNumbersModule,
  createWebhookModule,
  sipgateIO,
  SipgateIOClient,
} from 'sipgateio';
import { Device } from 'sipgateio/dist/devices';
import { NumberResponseItem } from 'sipgateio/dist/numbers';
import { CallHistory, db } from './db';
import { respondToNewCall, respondToOnAnswer } from './logic';

dotenv.config();

function getEnvVariable(variableName: string, defaultValue?: string): string {
  const variable = process.env[variableName] ?? defaultValue;
  if (!variable) {
    console.error(`ERROR: You need to set ${variableName} in .env!\n`);
    process.exit();
  }
  return variable;
}

const serverAddress = getEnvVariable('WEBHOOK_URL');
const hostname = getEnvVariable('DATABASE_HOST', 'localhost');
const centralPhone = getEnvVariable('CENTRAL_SERVICE_PHONE');
const personalAccessTokenId = getEnvVariable('TOKEN_ID');
const personalAccessToken = getEnvVariable('TOKEN');

db.initialize().then(async () => {
  console.log('Database initialized 🗃️');
  db.synchronize();
});

type PhoningDevice = Device & {
  activePhonelines: { id: string; alias: string }[];
};

async function getOnlineNumbers(
  client: SipgateIOClient,
  authenticatedWebuser: string,
  numbers: NumberResponseItem[],
) {
  const devicesModule = createDevicesModule(client);
  const devices = await devicesModule.getDevices(authenticatedWebuser);
  const onlineDevices: PhoningDevice[] = devices.filter(
    (device) => device.online,
  ) as PhoningDevice[];
  const onlineIds = onlineDevices.flatMap((device) =>
    device.activePhonelines.map((phoneline) => phoneline.id),
  );
  const onlineNumbers = onlineIds.flatMap((id) =>
    numbers
      .filter((number) => number.endpointId === id)
      .map((number) => number.number),
  );
  return [...new Set(onlineNumbers)]; // remove duplicate numbers
}

async function main() {
  const client = sipgateIO({
    tokenId: personalAccessTokenId,
    token: personalAccessToken,
  });

  const numbersModule = createNumbersModule(client);
  const authenticatedWebuser = await client.getAuthenticatedWebuserId();
  const numbers = await numbersModule.getAllNumbers();

  const webhookModule = createWebhookModule();
  const webhookServer = await webhookModule.createServer({
    port: 8080,
    serverAddress,
    hostname,
  });

  console.log(
    `Server running at ${serverAddress}\n` +
      'Please set this URL for incoming calls at https://console.sipgate.com/webhooks/urls\n' +
      "ProTip: To see how to do that automatically, check out the example at 'examples/settings/settings_set_url_incoming.ts'\n" +
      'Ready for calls 📞',
  );

  webhookServer.onNewCall(async (newCallEvent) => {
    const onlineNumbers = await getOnlineNumbers(
      client,
      authenticatedWebuser,
      numbers.items,
    );
    return respondToNewCall(newCallEvent, centralPhone, db, onlineNumbers);
  });

  webhookServer.onAnswer(async (newAnswerEvent) =>
    respondToOnAnswer(newAnswerEvent, centralPhone, db),
  );
}

main().catch(console.error);

export default CallHistory;
