import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
}

@Entity('STOCK_MOVEMENT')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid', { name: 'stock_movement_id' })
  id: string;

  @ApiProperty()
  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @ApiProperty()
  @Column({ name: 'product_id' })
  productId: string;

  @ApiProperty()
  @Column()
  quantity: number;

  @ApiProperty({ enum: StockMovementType })
  @Column({ type: 'enum', enum: ['IN', 'OUT'] })
  type: 'IN' | 'OUT';

  @ApiProperty({ required: false })
  @Column({ name: 'reference_type', nullable: true })
  referenceType: string;

  @ApiProperty({ required: false })
  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
