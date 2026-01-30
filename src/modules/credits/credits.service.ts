import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreditPackage } from './entities/credit-package.entity';
import { UserCredit } from './entities/user-credit.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { PurchaseCreditsDto } from './dto/purchase-credits.dto';
import { BusinessException } from '../../common/exceptions/business.exception';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(CreditPackage)
    private readonly creditPackageRepository: Repository<CreditPackage>,
    @InjectRepository(UserCredit)
    private readonly userCreditRepository: Repository<UserCredit>,
    @InjectRepository(CreditTransaction)
    private readonly transactionRepository: Repository<CreditTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllActivePackages(): Promise<CreditPackage[]> {
    return this.creditPackageRepository.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  async purchaseCredits(userId: string, purchaseDto: PurchaseCreditsDto): Promise<{
    newBalance: number;
    creditsAdded: number;
    transactionId: string;
  }> {
    const packageEntity = await this.creditPackageRepository.findOne({
      where: { id: purchaseDto.packageId },
    });

    if (!packageEntity) {
      throw new NotFoundException(
        `Credit package not found. Requested ID: ${purchaseDto.packageId}. Use GET /credit-packages to see available packages.`,
      );
    }

    if (!packageEntity.isActive) {
      throw new BadRequestException('Credit package is not active');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let userCredit = await queryRunner.manager.findOne(UserCredit, {
        where: { userId },
      });

      if (!userCredit) {
        userCredit = queryRunner.manager.create(UserCredit, {
          userId,
          balance: 0,
          totalPurchased: 0,
          totalUsed: 0,
        });
      }

      userCredit.balance += packageEntity.credits;
      userCredit.totalPurchased += packageEntity.credits;

      await queryRunner.manager.save(UserCredit, userCredit);

      const transaction = queryRunner.manager.create(CreditTransaction, {
        userId,
        amount: packageEntity.credits,
        type: TransactionType.PURCHASE,
        referenceId: packageEntity.id,
        description: `Package purchase: ${packageEntity.name}`,
      });

      const savedTransaction = await queryRunner.manager.save(
        CreditTransaction,
        transaction,
      );

      await queryRunner.commitTransaction();

      return {
        newBalance: userCredit.balance,
        creditsAdded: packageEntity.credits,
        transactionId: savedTransaction.id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getBalance(userId: string): Promise<{
    balance: number;
    totalPurchased: number;
    totalUsed: number;
  }> {
    const userCredit = await this.userCreditRepository.findOne({
      where: { userId },
    });

    if (!userCredit) {
      return {
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
      };
    }

    return {
      balance: userCredit.balance,
      totalPurchased: userCredit.totalPurchased,
      totalUsed: userCredit.totalUsed,
    };
  }

  async getTransactions(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    transactions: CreditTransaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      transactions,
      total,
      page,
      limit,
    };
  }

  async deductCredits(
    userId: string,
    amount: number,
    type: TransactionType,
    referenceId: string,
    description: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userCredit = await queryRunner.manager.findOne(UserCredit, {
        where: { userId },
      });

      if (!userCredit) {
        throw new BusinessException('User credits not found');
      }

      if (userCredit.balance < amount) {
        throw new BusinessException('Insufficient credits');
      }

      userCredit.balance -= amount;
      userCredit.totalUsed += amount;

      await queryRunner.manager.save(UserCredit, userCredit);

      const transaction = queryRunner.manager.create(CreditTransaction, {
        userId,
        amount: -amount,
        type,
        referenceId,
        description,
      });

      await queryRunner.manager.save(CreditTransaction, transaction);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async addCredits(
    userId: string,
    amount: number,
    type: TransactionType,
    referenceId: string,
    description: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let userCredit = await queryRunner.manager.findOne(UserCredit, {
        where: { userId },
      });

      if (!userCredit) {
        userCredit = queryRunner.manager.create(UserCredit, {
          userId,
          balance: 0,
          totalPurchased: 0,
          totalUsed: 0,
        });
      }

      userCredit.balance += amount;

      await queryRunner.manager.save(UserCredit, userCredit);

      const transaction = queryRunner.manager.create(CreditTransaction, {
        userId,
        amount,
        type,
        referenceId,
        description,
      });

      await queryRunner.manager.save(CreditTransaction, transaction);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
