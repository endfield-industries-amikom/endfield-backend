import {
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Item } from '../../common/entities/item.entity';

@Entity('MATERIAL')
export class Material {
  @PrimaryColumn({ name: 'item_id' })
  id: string;

  @OneToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;
}
