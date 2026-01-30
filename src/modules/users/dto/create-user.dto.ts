import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must have at least 2 characters' })
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MENTEE })
  @IsEnum(UserRole, { message: 'Role must be MENTEE or MENTOR' })
  role: UserRole;
}
