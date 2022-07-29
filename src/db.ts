import * as dotenv from 'dotenv';
import { Column, DataSource, Entity, PrimaryGeneratedColumn } from 'typeorm';

dotenv.config();

const host = process.env.DATABASE_HOST || 'localhost';
const username = process.env.DATABASE_USERNAME || 'admin';
const password = process.env.DATABASE_PASSWORD || 'root';
const database = process.env.DATABASE_NAME || 'database';

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
  database,
  entities: [CallHistory],
  synchronize: true,
});
