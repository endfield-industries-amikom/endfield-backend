import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PurchaseOrder } from '../purchase-order/purchase-order.entity';
import { SalesOrder } from '../sales-order/sales-order.entity';

@Entity('SHIPMENT')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'po_id' })
  poId: string;

  @ManyToOne(() => PurchaseOrder)
  @JoinColumn({ name: 'po_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'sales_order_id', nullable: true })
  salesOrderId: string;

  @ManyToOne(() => SalesOrder)
  @JoinColumn({ name: 'sales_order_id' })
  salesOrder: SalesOrder;

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

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
