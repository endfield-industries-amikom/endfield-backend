import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from '../../common/entities/order.entity';
import { Supplier } from '../supplier/supplier.entity';

@Entity('PURCHASE_ORDER')
export class PurchaseOrder extends Order {
  @PrimaryGeneratedColumn('uuid', { name: 'po_id' })
  declare id: string;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;
}
