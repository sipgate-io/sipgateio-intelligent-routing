import * as dotenv from 'dotenv';
import {
  createConnection,
  DataSource,
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WebhookResponse, createWebhookModule } from 'sipgateio';
import getRandomIntInRange from './util';
// import AppDataSource from "./dataSource.js";

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

@Entity()
class CallHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerPhone: string;

  @Column()
  servicePhone: string;

  @Column()
  acceptedCalls: number;
}

const AppDataSource: DataSource = new DataSource({
  type: 'mysql',
  host: hostname,
  username: 'root',
  password: 'root',
  port: 3306,
  database: 'io-labs-telephone-status-request',
  entities: [CallHistory],
  synchronize: true,
});

AppDataSource.initialize().then(() => {
  console.log('initialized.');
  AppDataSource.synchronize();
});

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

    webhookServer.onHangUp(async (newHangupEvent) => {
      console.log(
        `New hangup from ${newHangupEvent.from} to ${newHangupEvent.to} (answering: ${newHangupEvent.answeringNumber})`,
      );
      await AppDataSource.createQueryBuilder()
        .insert()
        .into(CallHistory)
        .values([
          {
            customerPhone: '+4945555555555550',
            servicePhone: '+4945555555555559',
            acceptedCalls: 8,
          },
          {
            customerPhone: '+4945555555555550',
            servicePhone: '+4945555555555558',
            acceptedCalls: 3,
          },
          {
            customerPhone: '+4945555555555550',
            servicePhone: '+4945555555555557',
            acceptedCalls: 2,
          },
          {
            customerPhone: '+4945555555555550',
            servicePhone: '+4945555555555556',
            acceptedCalls: 9,
          },
        ])
        .execute();

      const results = await AppDataSource.createQueryBuilder()
        .select('*')
        .from(CallHistory, 'call_history')
        .execute();
      console.log(results);
    });
  });
