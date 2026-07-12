import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';
import { Warehouse } from './warehouse.entity';
import { Region } from '../region/region.entity';
import { Inventory } from '../inventory/inventory.entity';
import { RegionsModule } from '../region/regions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Warehouse, Region, Inventory]),
    RegionsModule,
  ],
  providers: [WarehousesService],
  controllers: [WarehousesController],
  exports: [WarehousesService],
})
export class WarehousesModule {}
