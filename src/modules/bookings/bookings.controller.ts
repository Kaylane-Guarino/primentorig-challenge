import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { Booking } from './entities/booking.entity';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

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

  @Post()
  @ApiOperation({ summary: 'Create new booking' })
  @ApiHeader({
    name: 'X-User-Id',
    description: 'User ID (UUID) - mentee creating the booking',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 201, description: 'Booking created successfully', type: Booking })
  @ApiResponse({ status: 400, description: 'Invalid data, mentor unavailable, past date or less than 24h in advance' })
  @ApiResponse({ status: 404, description: 'Mentor not found' })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: any,
  ): Promise<Booking> {
    const menteeId = this.getUserId(req);
    return this.bookingsService.create(menteeId, createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'List user bookings (paginated)' })
  @ApiHeader({
    name: 'X-User-Id',
    description: 'User ID (UUID)',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  @ApiResponse({ status: 400, description: 'User ID is required or invalid parameters' })
  async findAll(
    @Query() query: BookingQueryDto,
    @Request() req: any,
  ): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userId = this.getUserId(req);
    return this.bookingsService.findAll(
      userId,
      query.status,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details' })
  @ApiHeader({
    name: 'X-User-Id',
    description: 'User ID (UUID)',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Booking found', type: Booking })
  @ApiResponse({ status: 400, description: 'User ID is required' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 403, description: 'No permission to access' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<Booking> {
    const userId = this.getUserId(req);
    return this.bookingsService.findOne(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiHeader({
    name: 'X-User-Id',
    description: 'User ID (UUID) - mentee canceling',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Booking canceled successfully', type: Booking })
  @ApiResponse({ status: 400, description: 'User ID is required or booking already canceled/completed' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 403, description: 'Only the mentee can cancel' })
  async cancel(@Param('id') id: string, @Request() req: any): Promise<Booking> {
    const userId = this.getUserId(req);
    return this.bookingsService.cancel(id, userId);
  }
}
