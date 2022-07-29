import { NewCallEvent , WebhookResponse } from 'sipgateio';
import { DataSource } from 'typeorm';
import { AnswerEvent, WebhookResponseInterface } from 'sipgateio/dist/webhook';
import CallHistory from './index';
import getRandomIntInRange from './util';

const FACTOR = 0.6;

export async function getRedirectNumber(
  customerPhone: string,
  database: DataSource,
  serviceTeamNumbers: string[],
): Promise<string> {
  let redirectNumber = '';
  let maxAcceptedCalls = 0;
  let totalAcceptedCalls = 0;
  /* eslint-disable no-await-in-loop */
  /* eslint-disable no-restricted-syntax */
  for (const servicePhone of serviceTeamNumbers) {
    const acceptedCalls = await database
      .createQueryBuilder()
      .select('*')
      .from(CallHistory, 'call_history')
      .where(`call_history.customerPhone = :customerPhone`, {
        customerPhone,
      })
      .andWhere(`call_history.servicePhone = :servicePhone`, {
        servicePhone,
      })
      .getCount();

    if (acceptedCalls > maxAcceptedCalls) {
      maxAcceptedCalls = acceptedCalls;
      redirectNumber = servicePhone;
    }
    totalAcceptedCalls += acceptedCalls;
    console.log(
      `Service Phone ${servicePhone} has accepted ${acceptedCalls} call(s) by ${customerPhone}`,
    );
  }

  if (maxAcceptedCalls > FACTOR * totalAcceptedCalls) {
    console.log(`Redirecting to ${redirectNumber}`);
    return redirectNumber;
  }
  console.log('Random redirect');
  return serviceTeamNumbers[getRandomIntInRange(serviceTeamNumbers.length)];
}

export async function respondToNewCall(
  newCallEvent: NewCallEvent,
  centralPhone: string,
  db: DataSource,
  serviceTeamNumbers: string[],
) {
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
}

export async function respondToOnAnswer(
  newAnswerEvent: AnswerEvent,
  centralPhone: string,
  db: DataSource,
) {
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
}
