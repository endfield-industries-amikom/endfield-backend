import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Region } from '../region/region.entity';

@Entity('WAREHOUSE')
export class Warehouse {
  @PrimaryGeneratedColumn('uuid', { name: 'warehouse_id' })
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'region_id', nullable: true })
  regionId: string;

  @ManyToOne(() => Region)
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @Column({ name: 'max_capacity', default: 10000 })
  maxCapacity: number;

  @Column({ name: 'current_load', default: 0 })
  currentLoad: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
