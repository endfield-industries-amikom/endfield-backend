import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../roles/role.entity';
import { UsersModule } from '../users/users.module';
import { EncryptionModule } from '../utils/encryption/encryption.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    UsersModule,
    EncryptionModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
