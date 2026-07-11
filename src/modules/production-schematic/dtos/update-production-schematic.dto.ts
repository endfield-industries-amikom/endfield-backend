import { PartialType } from '@nestjs/mapped-types';
import { CreateProductionSchematicDto } from './create-production-schematic.dto';

export class UpdateProductionSchematicDto extends PartialType(
  CreateProductionSchematicDto,
) {}
