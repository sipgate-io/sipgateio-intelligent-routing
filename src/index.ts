import * as dotenv from 'dotenv';
import {createDevicesModule, createNumbersModule, createWebhookModule, sipgateIO} from 'sipgateio';
import {CallHistory, db} from './db';
import {respondToNewCall, respondToOnAnswer} from './logic';
import {Device} from "sipgateio/dist/devices";

dotenv.config();

if (!process.env.WEBHOOK_URL) {
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

//TODO:ADD TOKEN CHECK

const serverAddress: string = process.env.WEBHOOK_URL;
const hostname: string = process.env.DATABASE_HOST || 'localhost';
const serviceTeamNumbers: string[] = process.env.SERVICE_PHONES.split(','); // all active phones
const centralPhone: string = process.env.CENTRAL_SERVICE_PHONE || '';
const personalAccessTokenId = process.env.TOKEN_ID || '';
const personalAccessToken = process.env.TOKEN || '';

db.initialize().then(async () => {
    console.log('Database initialized 🗃️');
    db.synchronize();
});

interface PersonalAccessTokenCredentials {
    tokenId: string;
    token: string;
}

const client = sipgateIO({
    tokenId: personalAccessTokenId,
    token: personalAccessToken,
});

// a utility function to print the IDs
function printIDs(array: any) {
    for (const obj of array) {
        console.log(obj.id);
    }
}


async function main() {
    const authenticatedWebuser = await client.getAuthenticatedWebuserId();
    const devicesModule = createDevicesModule(client);
    const devices = await devicesModule.getDevices(authenticatedWebuser);
    let onlineDevices: Device[] = [];
    devices.forEach(device => {
            if (device.online) {
                onlineDevices.push(device)
            }
    })
    onlineDevices.forEach(device => {
        Object.entries(device).find(([key, value]) => {
            if (key === 'activePhonelines') console.log(value);
        })
    });

    const numbersModule = createNumbersModule(client);

    numbersModule
        .getAllNumbers({ offset: 5, limit: 10 })
        .then(console.log)
        .catch(console.error);

    return onlineDevices;
}

main().then(data => {
    console.log(data)
    //console.log(data.forEach(entry => entry.id))
})
    .catch(error => {
    console.log(error);
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

        //TODO: Check for online Devices on new Call?
        webhookServer.onNewCall(async (newCallEvent) =>
            respondToNewCall(newCallEvent, centralPhone, db, serviceTeamNumbers),
        );

        webhookServer.onAnswer(async (newAnswerEvent) =>
            respondToOnAnswer(newAnswerEvent, centralPhone, db),
        );
    });

export default CallHistory;
