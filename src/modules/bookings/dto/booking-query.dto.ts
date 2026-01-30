import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '../../../common/enums/booking-status.enum';

export class BookingQueryDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus, { message: 'Status must be a valid value' })
  status?: BookingStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
