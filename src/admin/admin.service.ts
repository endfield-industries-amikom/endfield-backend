import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../roles/role.entity';
import { UsersService } from '../users/users.service';
import { EncryptionService } from '../utils/encryption/encryption.service';
import { CreateUserByAdminDto } from './dtos';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly usersService: UsersService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async createUser(dto: CreateUserByAdminDto) {
    const existingUser = await this.usersService.findOne(
      dto.username,
      dto.email,
    );
    if (existingUser) {
      throw new BadRequestException('Username or Email is already in use');
    }

    const role = await this.roleRepository.findOne({
      where: { roleName: dto.roleName },
    });
    if (!role) {
      throw new BadRequestException(`Role "${dto.roleName}" not found`);
    }

    try {
      const passwordHash = await this.encryptionService.hashPassword(
        dto.password,
      );
      const user = await this.usersService.createWithRole({
        username: dto.username,
        email: dto.email,
        passwordHash,
        roleId: role.id,
      });
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: role.roleName,
      };
    } catch (error) {
      this.logger.error('Failed to create user via admin', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async listUsers(page = 1, limit = 10, roleName?: string) {
    const [data, total] = await this.usersService.findAllPaginated(page, limit, roleName);
    return {
      data: data.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        role: u.role?.roleName ?? 'Unknown',
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
      })),
      total,
      page,
      limit,
    };
  }

  async getUserById(userId: string) {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role?.roleName ?? 'Unknown',
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };
  }
}
