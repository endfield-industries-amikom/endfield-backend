import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('INVENTORY')
export class Inventory {
  @PrimaryGeneratedColumn('uuid', { name: 'inventory_id' })
  id: string;

  @ApiProperty()
  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @ApiProperty()
  @Column({ name: 'product_id' })
  productId: string;

  @ApiProperty()
  @Column({ name: 'quantity_on_hand', default: 0 })
  quantityOnHand: number;

  @ApiProperty()
  @Column({ name: 'reserved_quantity', default: 0 })
  reservedQuantity: number;

  @ApiProperty()
  @Column({ name: 'reorder_level', default: 10 })
  reorderLevel: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
