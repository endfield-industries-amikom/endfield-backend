import { PartialType } from '@nestjs/swagger';
import { CreateProductionSimulationDto } from './create-production-simulation.dto';

export class UpdateProductionSimulationDto extends PartialType(
  CreateProductionSimulationDto,
) {}
