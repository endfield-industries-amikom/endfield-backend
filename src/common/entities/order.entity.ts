import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from '../../modules/order-item/order-item.entity';

@Entity('ORDER')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @Column({
    name: 'order_date',
    type: 'date',
    default: () => 'CURRENT_TIMESTAMP',
  })
  orderDate: Date;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => OrderItem, (oi) => oi.order)
  orderItems: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
