import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserCredit } from '../credits/entities/user-credit.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserCredit)
    private readonly userCreditRepository: Repository<UserCredit>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);

    const userCredit = this.userCreditRepository.create({
      userId: savedUser.id,
      balance: 0,
      totalPurchased: 0,
      totalUsed: 0,
    });
    await this.userCreditRepository.save(userCredit);

    return savedUser;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['userCredit'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findMentor(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user || user.role !== UserRole.MENTOR) {
      return null;
    }

    return user;
  }

  async findAllMentors(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.MENTOR },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllMentees(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.MENTEE },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
