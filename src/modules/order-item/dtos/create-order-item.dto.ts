import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsString()
  orderType: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  itemId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;
}
