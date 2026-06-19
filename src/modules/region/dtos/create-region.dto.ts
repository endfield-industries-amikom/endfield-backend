import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRegionDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  code: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
