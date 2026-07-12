import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './inventory.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryEventHandler } from './inventory-event.handler';
import { Shipment } from '../shipment/shipment.entity';
import { PurchaseOrder } from '../purchase-order/purchase-order.entity';
import { SalesOrder } from '../sales-order/sales-order.entity';
import { OrderItem } from '../order-item/order-item.entity';
import { Item } from '../../common/entities/item.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { ProductionSimulationModule } from '../production-simulation/production-simulation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory, Shipment, PurchaseOrder, SalesOrder,
      OrderItem, Item, Warehouse,
    ]),
    ProductionSimulationModule,
  ],
  providers: [InventoryService, InventoryEventHandler],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
