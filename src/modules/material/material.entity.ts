import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Item } from '../../common/entities/item.entity';

@Entity('MATERIAL')
export class Material extends Item {
  @PrimaryGeneratedColumn('uuid', { name: 'material_id' })
  declare id: string;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ name: 'is_purchaseable', default: true })
  declare isPurchaseable: boolean;

  @Column({ name: 'is_sellable', default: true })
  declare isSellable: boolean;
}
