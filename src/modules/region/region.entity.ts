import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('REGION')
export class Region {
  @PrimaryGeneratedColumn('uuid', { name: 'region_id' })
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 10, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
