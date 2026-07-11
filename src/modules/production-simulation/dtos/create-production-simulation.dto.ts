import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateProductionSimulationDto {
  @ApiProperty()
  @IsString()
  schematicId: string;

  @ApiProperty()
  @IsString()
  warehouseId: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
