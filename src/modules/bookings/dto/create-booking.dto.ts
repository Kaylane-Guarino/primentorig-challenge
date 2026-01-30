import { IsUUID, IsDateString, IsInt, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Mentor ID (UUID)',
  })
  @IsUUID(undefined, { message: 'Mentor ID must be a valid UUID' })
  mentorId: string;

  @ApiProperty({
    example: '2024-12-25T10:00:00Z',
    description: 'Scheduled date and time (ISO 8601)',
  })
  @IsDateString({}, { message: 'Scheduled date must be a valid date in ISO 8601 format' })
  scheduledAt: string;

  @ApiProperty({
    example: 30,
    enum: [30, 60],
    description: 'Booking duration in minutes',
  })
  @IsInt({ message: 'Duration must be an integer' })
  @IsIn([30, 60], { message: 'Duration must be 30 or 60 minutes' })
  @Min(30, { message: 'Minimum duration is 30 minutes' })
  duration: number;
}
