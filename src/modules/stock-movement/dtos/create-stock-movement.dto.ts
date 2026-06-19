import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum CreateStockMovementType {
  IN = 'IN',
  OUT = 'OUT',
}

export class CreateStockMovementDto {
  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ enum: CreateStockMovementType })
  @IsEnum(CreateStockMovementType)
  type: 'IN' | 'OUT';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
