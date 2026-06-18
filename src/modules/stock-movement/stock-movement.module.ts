import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from './stock-movement.entity';
import { StockMovementService } from './stock-movement.service';
import { StockMovementController } from './stock-movement.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement])],
  providers: [StockMovementService],
  controllers: [StockMovementController],
  exports: [StockMovementService],
})
export class StockMovementModule {}
