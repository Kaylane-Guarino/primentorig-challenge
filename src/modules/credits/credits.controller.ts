import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { PurchaseCreditsDto } from './dto/purchase-credits.dto';
import { PurchaseCreditsResponseDto } from './dto/purchase-credits-response.dto';
import { BalanceResponseDto } from './dto/balance-response.dto';
import { BalanceQueryDto } from './dto/balance-query.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { CreditPackage } from './entities/credit-package.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';

@ApiTags('Credits')
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  private getUserId(req: any): string {
    const headerUserId = 
      req.headers['x-user-id'] || 
      req.headers['X-User-Id'] || 
      req.headers['X-USER-ID'];
    
    const queryUserId = req.query?.userId;
    
    const userId = headerUserId || queryUserId;
    
    if (!userId) {
      throw new BadRequestException('User ID is required. Use header X-User-Id or query param userId');
    }
    
    return typeof userId === 'string' ? userId : String(userId);
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase credit package' })
  @ApiHeader({
    name: 'X-User-Id',
    description: 'User ID (UUID)',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 201, description: 'Credits purchased successfully', type: PurchaseCreditsResponseDto })
  @ApiResponse({ status: 404, description: 'Package not found' })
  @ApiResponse({ status: 400, description: 'Package is not active or User ID is required' })
  async purchase(
    @Body() purchaseDto: PurchaseCreditsDto,
    @Request() req: any,
  ): Promise<PurchaseCreditsResponseDto> {
    const userId = this.getUserId(req);
    return this.creditsService.purchaseCredits(userId, purchaseDto);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get user credit balance' })
  @ApiHeader({
    name: 'X-User-Id',
    description: 'User ID (UUID)',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully', type: BalanceResponseDto })
  @ApiResponse({ status: 400, description: 'User ID is required' })
  async getBalance(
    @Query() query: BalanceQueryDto,
    @Request() req: any,
  ): Promise<BalanceResponseDto> {
    const userId = this.getUserId(req);
    return this.creditsService.getBalance(userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history (paginated)' })
  @ApiHeader({
    name: 'X-User-Id',
    description: 'User ID (UUID)',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  @ApiResponse({ status: 400, description: 'User ID is required' })
  async getTransactions(
    @Query() query: TransactionQueryDto,
    @Request() req: any,
  ): Promise<{
    transactions: CreditTransaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const userId = this.getUserId(req);
    return this.creditsService.getTransactions(
      userId,
      query.page,
      query.limit,
    );
  }
}
