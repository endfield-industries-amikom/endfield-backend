import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionSchematic } from '../production-schematic/production-schematic.entity';
import { ProductionSimulationService } from './production-simulation.service';
import { ProductionSchematicModule } from '../production-schematic/production-schematic.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionSchematic]),
    forwardRef(() => ProductionSchematicModule),
  ],
  providers: [ProductionSimulationService],
  exports: [ProductionSimulationService],
})
export class ProductionSimulationModule {}
