import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreditsService } from '../credits/credits.service';
import { UsersService } from '../users/users.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { BusinessException } from '../../common/exceptions/business.exception';
import { BOOKING_CONSTANTS } from './constants/booking.constants';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly creditsService: CreditsService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async create(menteeId: string, createBookingDto: CreateBookingDto): Promise<Booking> {
    const scheduledAt = new Date(createBookingDto.scheduledAt);
    const now = new Date();

    if (scheduledAt <= now) {
      throw new BadRequestException(
        'Cannot book appointments for past or current dates',
      );
    }

    const minScheduledTime = new Date(
      now.getTime() + BOOKING_CONSTANTS.MIN_ADVANCE_HOURS * 60 * 60 * 1000,
    );
    if (scheduledAt < minScheduledTime) {
      throw new BadRequestException(
        `Booking must be made at least ${BOOKING_CONSTANTS.MIN_ADVANCE_HOURS} hours in advance`,
      );
    }

    if (
      createBookingDto.duration !== BOOKING_CONSTANTS.DURATIONS.MIN &&
      createBookingDto.duration !== BOOKING_CONSTANTS.DURATIONS.MAX
    ) {
      throw new BadRequestException(
        `Duration must be ${BOOKING_CONSTANTS.DURATIONS.MIN} or ${BOOKING_CONSTANTS.DURATIONS.MAX} minutes`,
      );
    }

    const mentor = await this.usersService.findMentor(createBookingDto.mentorId);
    if (!mentor) {
      throw new NotFoundException('Mentor not found');
    }

    if (mentor.id === menteeId) {
      throw new BadRequestException('Cannot book with yourself');
    }

    await this.validateTimeSlotAvailability(
      createBookingDto.mentorId,
      scheduledAt,
      createBookingDto.duration,
    );

    const creditsNeeded =
      createBookingDto.duration === BOOKING_CONSTANTS.DURATIONS.MIN
        ? BOOKING_CONSTANTS.CREDITS.THIRTY_MINUTES
        : BOOKING_CONSTANTS.CREDITS.SIXTY_MINUTES;

    const balance = await this.creditsService.getBalance(menteeId);
    if (balance.balance < creditsNeeded) {
      throw new BusinessException(
        `Insufficient credits. Required: ${creditsNeeded}, Available: ${balance.balance}`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const booking = queryRunner.manager.create(Booking, {
        menteeId,
        mentorId: createBookingDto.mentorId,
        scheduledAt,
        duration: createBookingDto.duration,
        creditsUsed: creditsNeeded,
        status: BookingStatus.PENDING,
      });

      const savedBooking = await queryRunner.manager.save(Booking, booking);

      await this.creditsService.deductCredits(
        menteeId,
        creditsNeeded,
        TransactionType.BOOKING,
        savedBooking.id,
        `Agendamento de ${createBookingDto.duration} minutos`,
      );

      await queryRunner.commitTransaction();

      this.logger.log(
        `Agendamento criado: ${savedBooking.id} - Mentee: ${menteeId}, Mentor: ${createBookingDto.mentorId}`,
      );

      const bookingWithRelations = await this.bookingRepository.findOne({
        where: { id: savedBooking.id },
        relations: ['mentee', 'mentor'],
      });

      if (!bookingWithRelations) {
        throw new NotFoundException('Booking not found after creation');
      }

      return bookingWithRelations;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error creating booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async validateTimeSlotAvailability(
    mentorId: string,
    scheduledAt: Date,
    duration: number,
  ): Promise<void> {
    const activeStatuses = [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
    ] as const;

    const mentorBookings = await this.bookingRepository.find({
      where: {
        mentorId,
        status: In(activeStatuses),
      },
    });

    const bookingEndTime = new Date(
      scheduledAt.getTime() + duration * 60 * 1000,
    );

    for (const existingBooking of mentorBookings) {
      const existingStartTime = new Date(existingBooking.scheduledAt);
      const existingEndTime = new Date(
        existingStartTime.getTime() + existingBooking.duration * 60 * 1000,
      );

      const hasOverlap =
        (scheduledAt >= existingStartTime && scheduledAt < existingEndTime) ||
        (bookingEndTime > existingStartTime && bookingEndTime <= existingEndTime) ||
        (scheduledAt <= existingStartTime && bookingEndTime >= existingEndTime);

      if (hasOverlap) {
        throw new BadRequestException(
          `Mentor already has a booking at this time (${existingStartTime.toISOString()} - ${existingEndTime.toISOString()})`,
        );
      }
    }
  }

  async findAll(
    userId: string,
    status?: BookingStatus,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100);

    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.mentee', 'mentee')
      .leftJoinAndSelect('booking.mentor', 'mentor')
      .where('(booking.menteeId = :userId OR booking.mentorId = :userId)', {
        userId,
      });

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    queryBuilder
      .orderBy('booking.scheduledAt', 'DESC')
      .skip((validPage - 1) * validLimit)
      .take(validLimit);

    const [bookings, total] = await queryBuilder.getManyAndCount();

    return {
      bookings,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async findOne(id: string, userId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['mentee', 'mentor'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.menteeId !== userId && booking.mentorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this booking',
      );
    }

    return booking;
  }

  async cancel(id: string, userId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['mentee', 'mentor'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.menteeId !== userId) {
      throw new ForbiddenException(
        'Only the mentee can cancel the booking',
      );
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking already canceled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot cancel a completed booking',
      );
    }

    const { refundAmount, refundPercentage } = this.calculateRefund(booking);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      booking.status = BookingStatus.CANCELLED;
      await queryRunner.manager.save(Booking, booking);

      if (refundAmount > 0) {
        await this.creditsService.addCredits(
          userId,
          refundAmount,
          TransactionType.REFUND,
          booking.id,
          `Reembolso de ${refundPercentage}% por cancelamento`,
        );
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Booking canceled: ${id} - Refund: ${refundAmount} credits (${refundPercentage}%)`,
      );

      return booking;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Erro ao cancelar agendamento ${id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private calculateRefund(booking: Booking): {
    refundAmount: number;
    refundPercentage: number;
  } {
    const now = new Date();
    const scheduledAt = new Date(booking.scheduledAt);
    const hoursUntilBooking =
      (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundAmount = 0;
    let refundPercentage = 0;

    if (hoursUntilBooking >= BOOKING_CONSTANTS.FULL_REFUND_HOURS) {
      refundAmount = booking.creditsUsed;
      refundPercentage = 100;
    } else if (hoursUntilBooking >= BOOKING_CONSTANTS.PARTIAL_REFUND_HOURS) {
      refundAmount = Math.floor(
        booking.creditsUsed * BOOKING_CONSTANTS.PARTIAL_REFUND_PERCENTAGE,
      );
      refundPercentage = 50;
    }

    return { refundAmount, refundPercentage };
  }
}
