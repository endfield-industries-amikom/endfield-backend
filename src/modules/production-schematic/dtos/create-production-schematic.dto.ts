import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
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
}
