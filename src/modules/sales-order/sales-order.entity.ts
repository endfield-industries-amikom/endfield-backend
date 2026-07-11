import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from '../../common/entities/order.entity';
import { Customer } from '../customer/customer.entity';
import { Warehouse } from '../warehouse/warehouse.entity';

@Entity('SALES_ORDER')
export class SalesOrder extends Order {
  @PrimaryGeneratedColumn('uuid', { name: 'order_id' })
  declare id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;
}
