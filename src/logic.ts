import { DataSource } from 'typeorm';
import CallHistory from './index';
import getRandomIntInRange from './util';

const FACTOR = 0.6;

async function getRedirectNumber(
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

export default getRedirectNumber;
