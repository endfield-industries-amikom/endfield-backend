import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Item } from '../../common/entities/item.entity';

@Entity('PRODUCT')
export class Product {
  @PrimaryGeneratedColumn('uuid', { name: 'product_id' })
  id: string;

  @Column({ name: 'item_id' })
  itemId: string;

  @OneToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ length: 50, default: 'product' })
  type: string;
}
