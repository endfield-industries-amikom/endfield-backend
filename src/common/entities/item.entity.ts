import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Abstract base entity for all stockable items (products and raw materials).
 * Not decorated with @Entity — meant to be extended by concrete entities
 * that define their own table mapping and PK column name.
 */
export abstract class Item {
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
