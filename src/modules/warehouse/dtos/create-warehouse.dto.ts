import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;
}
