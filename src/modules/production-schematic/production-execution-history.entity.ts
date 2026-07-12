import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductionSchematic } from './production-schematic.entity';
import { Warehouse } from '../warehouse/warehouse.entity';

@Entity('PRODUCTION_EXECUTION_HISTORY')
export class ProductionExecutionHistory {
  @PrimaryGeneratedColumn('uuid', { name: 'execution_id' })
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

  @Column({ name: 'started_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ name: 'finished_at', type: 'timestamp', nullable: true })
  finishedAt: Date;

  @Column({ default: 'RUNNING' })
  status: string;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
