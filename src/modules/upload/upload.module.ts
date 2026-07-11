import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { Product } from '../product/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [UploadController],
})
export class UploadModule {}
