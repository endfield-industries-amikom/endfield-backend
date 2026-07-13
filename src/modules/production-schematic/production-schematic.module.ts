import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionSchematic } from './production-schematic.entity';
import { ProductionExecutionHistory } from './production-execution-history.entity';
import { Inventory } from 'src/modules/inventory/inventory.entity';
import { ProductionSchematicService } from './production-schematic.service';
import { ProductionExecutionHistoryService } from './production-execution-history.service';
import { ProductionSchematicController } from './production-schematic.controller';
import { InventoryModule } from 'src/modules/inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionSchematic, ProductionExecutionHistory, Inventory]),
    forwardRef(() => InventoryModule),
  ],
  providers: [ProductionSchematicService, ProductionExecutionHistoryService],
  controllers: [ProductionSchematicController],
  exports: [ProductionSchematicService, ProductionExecutionHistoryService],
})
export class ProductionSchematicModule {}
