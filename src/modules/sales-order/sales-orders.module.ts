import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrder } from './sales-order.entity';
import { Order } from '../../common/entities/order.entity';
import { OrderItem } from '../order-item/order-item.entity';
import { Item } from '../../common/entities/item.entity';
import { Customer } from '../customer/customer.entity';
import { CustomersModule } from '../customer/customers.module';
import { OrderItemModule } from '../order-item/order-item.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesOrder, Order, OrderItem, Item, Customer]),
    CustomersModule,
    OrderItemModule,
  ],
  providers: [SalesOrdersService],
  controllers: [SalesOrdersController],
  exports: [SalesOrdersService],
})
export class SalesOrdersModule {}
