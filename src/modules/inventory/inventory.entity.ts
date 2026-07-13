import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Item } from '../../common/entities/item.entity';

@Entity('INVENTORY')
export class Inventory {
  @PrimaryGeneratedColumn('uuid', { name: 'inventory_id' })
  id: string;

  @ApiProperty()
  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @ApiProperty()
  @Column({ name: 'item_id' })
  itemId: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

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
