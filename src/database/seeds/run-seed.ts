import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { seedCreditPackages } from './seed-credit-packages';
import { CreditPackage } from '../../modules/credits/entities/credit-package.entity';
import { User } from '../../modules/users/entities/user.entity';
import { UserCredit } from '../../modules/credits/entities/user-credit.entity';
import { CreditTransaction } from '../../modules/credits/entities/credit-transaction.entity';
import { Booking } from '../../modules/bookings/entities/booking.entity';

config();

async function runSeed() {
  let dataSourceConfig: any;

  if (process.env.DATABASE_URL) {
    dataSourceConfig = {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [CreditPackage, User, UserCredit, CreditTransaction, Booking],
      synchronize: true,
    };
  } else {
    dataSourceConfig = {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'primentoring',
      entities: [CreditPackage, User, UserCredit, CreditTransaction, Booking],
      synchronize: true,
    };
  }

  const dataSource = new DataSource(dataSourceConfig);

  try {
    await dataSource.initialize();
    await seedCreditPackages(dataSource);
    await dataSource.destroy();
  } catch (error) {
    console.error('Error running seed:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

runSeed();
