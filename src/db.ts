import * as dotenv from 'dotenv';
import { AnswerEvent } from 'sipgateio';
import { Column, DataSource, Entity, PrimaryGeneratedColumn } from 'typeorm';

dotenv.config();

const host = process.env.DATABASE_HOST || 'localhost';
const username = process.env.DATABASE_USERNAME || 'admin';
const password = process.env.DATABASE_PASSWORD || 'root';
const databaseName = process.env.DATABASE_NAME || 'database';

@Entity()
export class CallHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'datetime',
    default: () => 'NOW()',
  })
  timestamp: Date;

  @Column()
  customerPhone: string;

  @Column()
  servicePhone: string;
}

export const db: DataSource = new DataSource({
  type: 'mysql',
  host,
  username,
  password,
  port: 3306,
  database: databaseName,
  entities: [CallHistory],
  synchronize: true,
});

export async function acceptedCallsCount(
  database: DataSource,
  customerPhone: string,
  servicePhone: string,
) {
  return database
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
}

export async function createHistoryEntry(
  database: DataSource,
  answerEvent: AnswerEvent,
) {
  await database
    .createQueryBuilder()
    .insert()
    .into(CallHistory)
    .values([
      {
        customerPhone: answerEvent.from,
        servicePhone: answerEvent.answeringNumber,
      },
    ])
    .execute();
}
