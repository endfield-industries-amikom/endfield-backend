import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateItemDto } from '../../../common/entities/item.dto';

export class CreateProductDto extends CreateItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'capacityUsage must be a valid decimal number with up to 2 decimal places' },
  )
  capacityUsage?: number;
}
