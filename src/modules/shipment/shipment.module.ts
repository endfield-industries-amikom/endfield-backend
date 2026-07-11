import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './shipment.entity';
import { ShipmentService } from './shipment.service';
import { ShipmentController } from './shipment.controller';
import { SalesOrder } from '../sales-order/sales-order.entity';
import { PurchaseOrder } from '../purchase-order/purchase-order.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { Inventory } from '../inventory/inventory.entity';
import { ProductionSimulationModule } from '../production-simulation/production-simulation.module';
import { OrderItem } from '../order-item/order-item.entity';
import { Product } from '../product/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shipment,
      SalesOrder,
      PurchaseOrder,
      Inventory,
      OrderItem,
      Product,
    ]),
    InventoryModule,
    ProductionSimulationModule,
  ],
  providers: [ShipmentService],
  controllers: [ShipmentController],
  exports: [ShipmentService],
})
export class ShipmentModule {}
