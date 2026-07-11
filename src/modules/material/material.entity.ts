import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Item } from '../../common/entities/item.entity';

@Entity('MATERIAL')
export class Material {
  @PrimaryGeneratedColumn('uuid', { name: 'material_id' })
  id: string;

  @Column({ name: 'item_id' })
  itemId: string;

  @OneToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ length: 50, nullable: true })
  unit: string;
}
