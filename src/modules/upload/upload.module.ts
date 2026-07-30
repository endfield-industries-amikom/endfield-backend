import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { Item } from '../../common/entities/item.entity';
import { Blog } from '../blog/blog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Item, Blog])],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
