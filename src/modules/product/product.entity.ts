import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Item } from '../../common/entities/item.entity';

@Entity('PRODUCT')
export class Product {
  @PrimaryColumn({ name: 'item_id' })
  id: string;

  @OneToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ length: 50, default: 'product' })
  type: string;
}
