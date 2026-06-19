import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Forecast } from './forecast.entity';
import { ForecastService } from './forecast.service';
import { ForecastController } from './forecast.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Forecast])],
  providers: [ForecastService],
  controllers: [ForecastController],
  exports: [ForecastService],
})
export class ForecastModule {}
