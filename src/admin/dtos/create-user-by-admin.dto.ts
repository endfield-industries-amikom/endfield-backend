import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';

export class CreateUserByAdminDto {
  @ApiProperty({ example: 'employee1' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'employee1@endfield.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Employee', enum: ['Admin', 'Employee', 'Editor'] })
  @IsString()
  @IsIn(['Admin', 'Employee', 'Editor'])
  roleName: string;
}
