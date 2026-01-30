import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BookingStatus } from '../../../common/enums/booking-status.enum';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  menteeId: string;

  @ManyToOne(() => User, (user) => user.menteeBookings)
  @JoinColumn({ name: 'menteeId' })
  mentee: User;

  @Column()
  mentorId: string;

  @ManyToOne(() => User, (user) => user.mentorBookings)
  @JoinColumn({ name: 'mentorId' })
  mentor: User;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ type: 'integer' })
  duration: number;

  @Column({ type: 'integer' })
  creditsUsed: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
