import { ApiProperty } from '@nestjs/swagger';

export class BalanceResponseDto {
  @ApiProperty()
  balance: number;

  @ApiProperty()
  totalPurchased: number;

  @ApiProperty()
  totalUsed: number;
}
