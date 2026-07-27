import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { Item } from '../../common/entities/item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Item])],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
