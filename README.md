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

Start the Docker container for the database with `docker-compose up -d` and launch the application with `npm start`. After that the PUSH-API is waiting for incoming calls.

## Example Usecase

After you have started the setup you can call your central phone number. This central phone number redirects to your service phones.

By the first call you will be redirected to a random service phone.
After that you get redirected to the preferred phone number if one service phone has answered more than 60% of the calls from that number.

## Code Walkthrough

<!-- A short and easy to understand explanation on the general code structure. <br/>
For example: `Request is made` -> `Data is transformed` -> `Data is saved to database` -->

## Troubleshoot

<!-- A description of common errors and how to fix them.  -->

# License

<!-- For example:
This project is licensed under The Unlicense (see [LICENSE](https://github.com/sipgate-io/sipgateio-sendsms-python/blob/master/LICENSE) file). -->
