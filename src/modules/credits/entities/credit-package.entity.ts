import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('credit_packages')
export class CreditPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  credits: number;

  @Column()
  price: number; // in cents

  @Column({ default: true })
  isActive: boolean;
}
