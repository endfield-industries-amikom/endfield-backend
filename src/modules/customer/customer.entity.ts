import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('CUSTOMER')
export class Customer {
  @PrimaryGeneratedColumn('uuid', { name: 'customer_id' })
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
