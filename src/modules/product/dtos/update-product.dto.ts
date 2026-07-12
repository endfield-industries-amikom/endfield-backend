import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { UpdateItemDto } from '../../../common/entities/item.dto';

export class UpdateProductDto extends UpdateItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;
}
