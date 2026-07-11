import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductionSchematic } from '../production-schematic/production-schematic.entity';
import { Warehouse } from '../warehouse/warehouse.entity';

@Entity('PRODUCTION_SIMULATION')
export class ProductionSimulation {
  @PrimaryGeneratedColumn('uuid', { name: 'production_simulation_id' })
  id: string;

  @Column({ name: 'schematic_id' })
  schematicId: string;

  @ManyToOne(() => ProductionSchematic)
  @JoinColumn({ name: 'schematic_id' })
  schematic: ProductionSchematic;

  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
