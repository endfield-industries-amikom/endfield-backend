import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductionSchematicDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  inputs: string[];

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNotEmpty()
  inputQty: number[];

  @ApiProperty()
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  outputQty: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  outputItemId: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warehouseIds?: string[];
}
