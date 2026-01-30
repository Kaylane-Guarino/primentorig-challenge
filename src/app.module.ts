import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { CreditsModule } from './modules/credits/credits.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { User } from './modules/users/entities/user.entity';
import { CreditPackage } from './modules/credits/entities/credit-package.entity';
import { UserCredit } from './modules/credits/entities/user-credit.entity';
import { CreditTransaction } from './modules/credits/entities/credit-transaction.entity';
import { Booking } from './modules/bookings/entities/booking.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        if (process.env.DATABASE_URL) {
          return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [User, CreditPackage, UserCredit, CreditTransaction, Booking],
            migrations: ['dist/database/migrations/*.js'],
            synchronize: false,
          };
        }
        return {
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
          database: process.env.DB_NAME || 'primentoring',
          entities: [User, CreditPackage, UserCredit, CreditTransaction, Booking],
          migrations: ['dist/database/migrations/*.js'],
          synchronize: false,
        };
      },
    }),    
    UsersModule,
    CreditsModule,
    BookingsModule,
  ],
})
export class AppModule {}
