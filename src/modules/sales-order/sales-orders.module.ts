import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrder } from './sales-order.entity';
import { CustomersModule } from '../customer/customers.module';
import { WarehousesModule } from '../warehouse/warehouses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesOrder]),
    CustomersModule,
    WarehousesModule,
  ],
  providers: [SalesOrdersService],
  controllers: [SalesOrdersController],
  exports: [SalesOrdersService],
})
export class SalesOrdersModule {}
