import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateSalesOrderDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  orderDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalAmount?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
