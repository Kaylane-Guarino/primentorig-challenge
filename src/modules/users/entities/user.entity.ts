import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { UserCredit } from '../../credits/entities/user-credit.entity';
import { CreditTransaction } from '../../credits/entities/credit-transaction.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => UserCredit, (userCredit) => userCredit.user)
  userCredit: UserCredit;

  @OneToMany(() => CreditTransaction, (transaction) => transaction.user)
  transactions: CreditTransaction[];

  @OneToMany(() => Booking, (booking) => booking.mentee)
  menteeBookings: Booking[];

  @OneToMany(() => Booking, (booking) => booking.mentor)
  mentorBookings: Booking[];
}
