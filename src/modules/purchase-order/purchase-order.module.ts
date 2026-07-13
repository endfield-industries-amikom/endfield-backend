import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { Order } from '../../common/entities/order.entity';
import { OrderItem } from '../order-item/order-item.entity';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { OrderItemModule } from '../order-item/order-item.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, Order, OrderItem]),
    OrderItemModule,
  ],
  providers: [PurchaseOrderService],
  controllers: [PurchaseOrderController],
  exports: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
