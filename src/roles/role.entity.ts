import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ROLE')
export class Role {
  @PrimaryGeneratedColumn({ name: 'role_id' })
  id: number;

  @Column({ name: 'role_name', length: 50, unique: true })
  roleName: string;
}
