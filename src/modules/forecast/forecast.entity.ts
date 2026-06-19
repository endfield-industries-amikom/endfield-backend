import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('FORECAST')
export class Forecast {
  @PrimaryGeneratedColumn('uuid', { name: 'forecast_id' })
  id: string;

  @ApiProperty()
  @Column({ name: 'region_id' })
  regionId: string;

  @ApiProperty()
  @Column({ name: 'product_id', nullable: true })
  productId: string;

  @ApiProperty()
  @Column({ name: 'forecast_date', type: 'date' })
  forecastDate: Date;

  @ApiProperty()
  @Column({ name: 'predicted_quantity' })
  predictedQuantity: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
