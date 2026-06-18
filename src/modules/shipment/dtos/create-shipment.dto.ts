import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty()
  @IsString()
  poId: string;

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
