import { Injectable, NotFoundException } from '@nestjs/common';
import { RegisterUserDto } from './dtos/index';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async create(userDto: RegisterUserDto & { passwordHash: string }) {
    const user = this.userRepository.create({
      username: userDto.username,
      email: userDto.email,
      passwordHash: userDto.passwordHash,
      roleId: 3, // Consumer — self-registration always defaults to Consumer
    });
    return this.userRepository.save(user);
  }

  async createWithRole(dto: {
    username: string;
    email: string;
    passwordHash: string;
    roleId: number;
  }) {
    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      passwordHash: dto.passwordHash,
      roleId: dto.roleId,
    });
    return this.userRepository.save(user);
  }

  async findAllPaginated(page = 1, limit = 10, roleName?: string | string[]) {
    if (roleName && roleName instanceof Array) {
      return this.userRepository.findAndCount({
        relations: ['role'],
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
        where: { role: { roleName: In(roleName) } },
      });
    }
    return this.userRepository.findAndCount({
      relations: ['role'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      where: roleName ? { role: { roleName } } : undefined,
    });
  }

  async findUserById(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
  }

  async findOne(username?: string, email?: string) {
    if (username && email) {
      return this.userRepository.findOne({
        where: [{ username }, { email }],
        relations: ['role'],
      });
    }
    if (username) {
      return this.userRepository.findOne({
        where: { username },
        relations: ['role'],
      });
    }
    if (email) {
      return this.userRepository.findOne({
        where: { email },
        relations: ['role'],
      });
    }
    return null;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastLogin: new Date() });
  }

  async updateProfile(
    userId: string,
    data: Partial<Pick<User, 'fullName' | 'username' | 'email'>>,
  ): Promise<User> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  async deleteUserById(userId: string): Promise<void> {
    const result = await this.userRepository.delete(userId);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }
}
