import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Item } from '../../common/entities/item.entity';

@Entity('PRODUCT')
export class Product extends Item {
  @PrimaryGeneratedColumn('uuid', { name: 'product_id' })
  declare id: string;

  @Column({ length: 50, default: 'product' })
  type: string;

  @Column({
    name: 'capacity_usage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1,
  })
  capacityUsage: number;

  @Column({ name: 'image_uri', nullable: true })
  imageUri: string;

  @Column({ name: 'sold_qty', default: 0 })
  soldQty: number;
}
