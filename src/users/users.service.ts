import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dtos/index';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import { EncryptionService } from '../utils/encryption/encryption.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(userDto: RegisterUserDto) {
    const user = await this.userRepository.save({ ...userDto });
    return user;
  }

  async findUserById(userId: string) {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async findOne(username?: string, email?: string) {
    return this.userRepository.findOne({ where: { username, email } });
  }

  async deleteUserById(userId: string): Promise<void> {
    await this.userRepository.delete(userId);
  }
}
