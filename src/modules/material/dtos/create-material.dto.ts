import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateItemDto, UpdateItemDto } from '../../../common/entities/item.dto';

export class CreateMaterialDto extends CreateItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;
}

export class UpdateMaterialDto extends UpdateItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;
}
