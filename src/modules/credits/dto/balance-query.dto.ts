import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BalanceQueryDto {
  @ApiPropertyOptional({
    description: 'User ID (alternative to X-User-Id header)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId?: string;
}
