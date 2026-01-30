import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { CreditsModule } from '../credits/credits.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    CreditsModule,
    UsersModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
