import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Supplier } from '../supplier/supplier.entity';

@Entity('PURCHASE_ORDER')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid', { name: 'po_id' })
  id: string;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
