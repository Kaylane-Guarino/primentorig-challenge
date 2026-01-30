import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../modules/users/entities/user.entity';
import { CreditPackage } from '../modules/credits/entities/credit-package.entity';
import { UserCredit } from '../modules/credits/entities/user-credit.entity';
import { CreditTransaction } from '../modules/credits/entities/credit-transaction.entity';
import { Booking } from '../modules/bookings/entities/booking.entity';

config();

const dataSourceConfig: any = process.env.DATABASE_URL
  ? {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, CreditPackage, UserCredit, CreditTransaction, Booking],
      migrations: ['src/database/migrations/*.ts'],
      synchronize: false,
      logging: false,
    }
  : {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'primentoring',
      entities: [User, CreditPackage, UserCredit, CreditTransaction, Booking],
      migrations: ['src/database/migrations/*.ts'],
      synchronize: false,
      logging: false,
    };

export const AppDataSource = new DataSource(dataSourceConfig);
