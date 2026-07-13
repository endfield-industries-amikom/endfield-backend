import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ITEM')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  sku: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column({ name: 'is_sellable', default: false })
  isSellable: boolean;

  @Column({ name: 'is_purchaseable', default: false })
  isPurchaseable: boolean;

  @Column({ name: 'is_manufactureable', default: false })
  isManufactureable: boolean;

  @Column({ name: 'image_uri', nullable: true })
  imageUri: string;

  @Column({ name: 'sold_qty', default: 0 })
  soldQty: number;

  @Column({
    name: 'capacity_usage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1,
  })
  capacityUsage: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
