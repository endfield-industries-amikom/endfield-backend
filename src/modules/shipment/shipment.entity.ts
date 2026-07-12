import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../common/entities/order.entity';

@Entity('SHIPMENT')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_type' })
  orderType: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ nullable: true })
  carrier: string;

  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber: string;

  @Column({ name: 'shipped_date', type: 'date', nullable: true })
  shippedDate: Date;

  @Column({ name: 'delivery_date', type: 'date', nullable: true })
  deliveryDate: Date;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ name: 'status_message', type: 'text', nullable: true })
  statusMessage: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
