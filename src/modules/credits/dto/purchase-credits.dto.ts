import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class PurchaseCreditsDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty({ message: 'Package ID is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsUUID(undefined, { message: 'Package ID must be a valid UUID' })
  packageId: string;
}
