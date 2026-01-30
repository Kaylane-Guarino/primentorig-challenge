import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: User })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'List of users', type: [User] })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('mentors')
  @ApiOperation({ summary: 'List all mentors' })
  @ApiResponse({ status: 200, description: 'List of mentors', type: [User] })
  async findAllMentors(): Promise<User[]> {
    return this.usersService.findAllMentors();
  }

  @Get('mentees')
  @ApiOperation({ summary: 'List all mentees' })
  @ApiResponse({ status: 200, description: 'List of mentees', type: [User] })
  async findAllMentees(): Promise<User[]> {
    return this.usersService.findAllMentees();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }
}
