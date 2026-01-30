import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { CreditPackagesController } from './credit-packages.controller';
import { CreditPackage } from './entities/credit-package.entity';
import { UserCredit } from './entities/user-credit.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreditPackage,
      UserCredit,
      CreditTransaction,
    ]),
  ],
  controllers: [CreditsController, CreditPackagesController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
