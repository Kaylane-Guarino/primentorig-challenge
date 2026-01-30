import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TransactionType } from '../../../common/enums/transaction-type.enum';

@Entity('credit_transactions')
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  amount: number; // positive for additions, negative for deductions

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ nullable: true })
  referenceId: string; // links to booking or purchase

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
