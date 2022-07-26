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

  serviceTeamNumbers.forEach(async (servicePhone) => {
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
  });

  const totalAcceptedCalls = await database
    .createQueryBuilder()
    .select('*')
    .from(CallHistory, 'call_history')
    .where(`call_history.customerPhone = :customerPhone`, {
      customerPhone,
    })
    .getCount();

  if (maxAcceptedCalls > FACTOR * totalAcceptedCalls) {
    return redirectNumber;
  }
  return serviceTeamNumbers[getRandomIntInRange(serviceTeamNumbers.length)];
}

export default getRedirectNumber;
