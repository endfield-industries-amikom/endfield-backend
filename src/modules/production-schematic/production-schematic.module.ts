import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionSchematic } from './production-schematic.entity';
import { Inventory } from 'src/modules/inventory/inventory.entity';
import { ProductionSchematicService } from './production-schematic.service';
import { ProductionSchematicController } from './production-schematic.controller';
import { InventoryModule } from 'src/modules/inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionSchematic, Inventory]),
    forwardRef(() => InventoryModule),
  ],
  providers: [ProductionSchematicService],
  controllers: [ProductionSchematicController],
  exports: [ProductionSchematicService],
})
export class ProductionSchematicModule {}
