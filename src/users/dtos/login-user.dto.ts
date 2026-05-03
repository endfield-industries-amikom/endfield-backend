import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class loginUserDto {
  @ApiProperty()
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @IsOptional()
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;
}
