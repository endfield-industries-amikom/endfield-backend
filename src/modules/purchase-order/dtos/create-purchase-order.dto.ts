import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsString()
  supplierId: string;

  @ApiProperty()
  @IsString()
  warehouseId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
