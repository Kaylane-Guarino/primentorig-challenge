import { ApiProperty } from '@nestjs/swagger';

export class PurchaseCreditsResponseDto {
  @ApiProperty()
  newBalance: number;

  @ApiProperty()
  creditsAdded: number;

  @ApiProperty()
  transactionId: string;
}
