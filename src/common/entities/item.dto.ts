import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateItemDto {
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isSellable?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPurchaseable?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isManufactureable?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUri?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  soldQty?: number;
}

export class UpdateItemDto {
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isSellable?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPurchaseable?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isManufactureable?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUri?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  soldQty?: number;
}
