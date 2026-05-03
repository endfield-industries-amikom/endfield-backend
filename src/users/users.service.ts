import { Injectable } from '@nestjs/common';
import { RegisterUserDto, loginUserDto, DeleteUserDto } from './dtos/index';
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

  async register(userDto: RegisterUserDto) {
    const user = new User();
    user.email = userDto.email;
    user.username = userDto.username;
    user.password = await this.encryptionService.hashPassword(userDto.password);
    await this.userRepository.save(user);
    return user;
  }

  async login(loginDto: loginUserDto) {
    const user = await this.userRepository.findOne({
      where: [{ email: loginDto.email }, { username: loginDto.username }],
    });
    if (
      !user ||
      !(await this.encryptionService.verifyPassword(
        loginDto.password,
        user.password,
      ))
    ) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  async deleteUser(deleteUserDto: DeleteUserDto) {
    const user = await this.userRepository.findOne({
      where: [
        { email: deleteUserDto.email },
        { username: deleteUserDto.username },
      ],
    });
    if (
      !user ||
      !(await this.encryptionService.verifyPassword(
        deleteUserDto.password,
        user.password,
      ))
    ) {
      throw new Error('Invalid credentials');
    }
    await this.userRepository.remove(user);
    return user;
  }
}
