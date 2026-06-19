import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateForecastDto {
  @ApiProperty()
  @IsUUID()
  regionId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty()
  @IsDateString()
  forecastDate: Date;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  predictedQuantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  confidence?: number;
}
