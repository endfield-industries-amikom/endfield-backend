import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Shared base DTO for creating any stockable item.
 */
export abstract class CreateItemDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sku: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'unitPrice must be a valid decimal number with up to 2 decimal places' },
  )
  unitPrice: number;
}

/**
 * Shared base DTO for updating any stockable item.
 */
export abstract class UpdateItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sku?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'unitPrice must be a valid decimal number with up to 2 decimal places' },
  )
  unitPrice?: number;
}
