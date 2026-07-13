import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { EncryptionService } from 'src/utils/encryption/encryption.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDto, TokenDto, UserDto } from './dtos';
import { RegisterUserDto } from './dtos/register.dto';
import { User } from 'src/users/users.entity';
import { Customer } from 'src/modules/customer/customer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly encryptionService: EncryptionService,
    private jwtService: JwtService,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  private async generateToken(user: User): Promise<TokenDto> {
    const roleName = user.role?.roleName ?? 'Viewer';
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: roleName,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      access_token: accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: roleName,
      },
    };
  }

  async register(registerDto: RegisterUserDto): Promise<TokenDto> {
    try {
      const existingUser = await this.usersService.findOne(
        registerDto.username,
        registerDto.email,
      );
      if (existingUser) {
        throw new BadRequestException('Username or Email is already in use');
      }
      const user = await this.usersService.create({
        ...registerDto,
        passwordHash: await this.encryptionService.hashPassword(
          registerDto.password,
        ),
      });

      // Auto-create a Customer record linked to this user
      const customer = this.customerRepository.create({
        name: user.username,
        code: `CUST-${user.id.substring(0, 8)}`,
        email: user.email,
      });
      await this.customerRepository.save(customer);
      this.logger.log(`Customer auto-created for user ${user.id}`);

      return this.generateToken(user);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Registration failed', error);
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async signIn(
    signInDto: SignInDto,
    session: any,
  ): Promise<TokenDto & { refreshToken: string }> {
    const user = await this.usersService.findOne(
      signInDto.username,
      signInDto.email,
    );
    if (
      !user ||
      !(await this.encryptionService.verifyPassword(
        signInDto.password,
        user.passwordHash,
      ))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    await this.usersService.updateLastLogin(user.id);

    const tokenData = await this.generateToken(user);

    // Store refresh token in server-side session
    session.refreshToken = crypto.randomUUID();
    session.userId = user.id;
    session.createdAt = new Date();
    session.expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    );

    return {
      ...tokenData,
      refreshToken: session.refreshToken,
    };
  }

  async refresh(session: any): Promise<TokenDto> {
    if (!session.refreshToken) {
      throw new UnauthorizedException('No refresh token in session');
    }

    if (new Date() > new Date(session.expiresAt)) {
      session.destroy();
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.usersService.findUserById(session.userId);
    if (!user) {
      session.destroy();
      throw new UnauthorizedException('User not found');
    }

    return this.generateToken(user);
  }

  async logout(session: any): Promise<void> {
    return new Promise((resolve, reject) => {
      session.destroy((err?: Error) => {
        if (err) {
          this.logger.error('Session destroy failed', err);
          reject(new InternalServerErrorException('Logout failed'));
        } else {
          resolve();
        }
      });
    });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (
      user &&
      (await this.encryptionService.verifyPassword(password, user.passwordHash))
    ) {
      return user;
    }
    return null;
  }

  async profile(userId: string): Promise<UserDto> {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role?.roleName ?? 'Viewer',
    };
  }

  async deleteUser(userId: string): Promise<void> {
    await this.usersService.deleteUserById(userId);
  }
}
