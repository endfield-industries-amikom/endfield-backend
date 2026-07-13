import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({ description: 'PURCHASE or SALES' })
  @IsString()
  @IsIn(['PURCHASE', 'SALES'])
  orderType: string;

  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  shippedDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
