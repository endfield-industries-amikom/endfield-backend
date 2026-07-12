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
import { Item } from '../../common/entities/item.entity';

@Entity('PRODUCTION_SCHEMATIC')
export class ProductionSchematic {
  @PrimaryGeneratedColumn('uuid', { name: 'production_schematic_id' })
  id: string;

  @ApiProperty()
  @Column({ length: 255 })
  name: string;

  @ApiProperty()
  @Column({ length: 100 })
  type: string;

  @ApiProperty({ type: [String] })
  @Column({ type: 'simple-json', nullable: true })
  inputs: string[];

  @ApiProperty({ type: [Number] })
  @Column({ type: 'simple-json', nullable: true })
  inputQty: number[];

  @ApiProperty()
  @Column({ type: 'int' })
  duration: number;

  @ApiProperty()
  @Column({ type: 'int', name: 'output_qty' })
  outputQty: number;

  @ApiProperty()
  @Column({ name: 'output_item_id' })
  outputItemId: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'output_item_id' })
  outputItem: Item;

  @ApiProperty({ default: false })
  @Column({ default: false })
  active: boolean;

  @ApiProperty({ type: [String] })
  @Column({ name: 'warehouse_ids', type: 'simple-json', nullable: true })
  warehouseIds: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
