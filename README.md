# sipgateio intelligent routing

This repo showcases an intelligent routing service which is able to choose a preferred phoneline for a caller.
We use sipgate.io's PUSH-API to get the necessary newcall- and hangup-events.
If the caller's phone number is already stored in our database, the caller is redirected to a service phone with most accepted calls of this caller.

## Prerequisites

You need to have Node.js and NPM installed.

## Installation & Startup

<!-- A how-to on the installation process.
This should include a description on how to set environment variables, should they be required.
Tokens and their scopes should also be explained sufficiently.

Furthermore, the startup process should be explained. -->

Install dependencies by `npm i` and fill a `.env` from the `.env.example` template.

Tunnel a localhost for the webhook calls. You may want to use localhost.run or ngrok.

The webhook URL must be copied to [sipgate.io](https://console.sipgate.com/webhooks/urls).
You can configure the webhooks as follows:

- Navigate to console.sipgate.com and login with your sipgate account credentials.

- Select the Webhooks > URLs tab in the left side menu

- Click the gear icon of the Incoming or Outgoing entry

- Fill in your webhook URL and click save.

Start the Docker container for the database with `docker-compose up -d` and launch the application with `npm start`. After that the PUSH-API is waiting for incoming calls.

To make this code example work you need to have configured at least two sipgate phone numbers.
The first one is your central phone number. It must be assigned to a device, so it can handle incoming calls.
The others will be considered service numbers. These numbers must also be assigned to a device. For testing it is enough when all phone numbers are assigned to the same device.

## Example Usecase

After you have started the setup you can call your central phone number. This central phone number redirects to your service phones.

By the first call you will be redirected to a random service phone.
After that you get redirected to the preferred phone number if one service phone has answered more than 60% of the calls from that number.

## Code Walkthrough

<!-- A short and easy to understand explanation on the general code structure. <br/>
For example: `Request is made` -> `Data is transformed` -> `Data is saved to database` -->

In the `res`-folder we store the announcement that is played when the redirect starts.

In `src` we store all the `.ts`-files.

First, the `db.ts` declares the database structure and the CallHistory-table.

In the `index.ts` we initiate our database and create the webhook respond server.

The `logic.ts` contains the logic like redirect functions. Event processing is also handled here.

The `util.ts` provides utility functions.
