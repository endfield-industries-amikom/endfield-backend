import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionSimulation } from './production-simulation.entity';
import { ProductionSimulationService } from './production-simulation.service';
import { ProductionSimulationController } from './production-simulation.controller';
import { ProductionSchematicModule } from '../production-schematic/production-schematic.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionSimulation]),
    ProductionSchematicModule,
    InventoryModule,
  ],
  providers: [ProductionSimulationService],
  controllers: [ProductionSimulationController],
  exports: [ProductionSimulationService],
})
export class ProductionSimulationModule {}
