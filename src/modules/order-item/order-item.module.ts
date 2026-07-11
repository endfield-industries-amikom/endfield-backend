import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from './order-item.entity';
import { OrderItemService } from './order-item.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderItem])],
  providers: [OrderItemService],
  exports: [OrderItemService],
})
export class OrderItemModule {}
