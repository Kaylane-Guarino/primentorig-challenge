import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_credits')
export class UserCredit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.userCredit)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: 0 })
  balance: number;

  @Column({ default: 0 })
  totalPurchased: number;

  @Column({ default: 0 })
  totalUsed: number;
}
