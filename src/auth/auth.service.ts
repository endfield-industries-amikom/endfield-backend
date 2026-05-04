import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { EncryptionService } from 'src/utils/encryption/encryption.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDto, TokenDto, UserDto } from './dtos';
import { RegisterUserDto } from './dtos/register.dto';
import { User } from 'src/users/users.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly encryptionService: EncryptionService,
    private jwtService: JwtService,
  ) {}

  private async generateToken(user: User): Promise<TokenDto> {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      access_token: accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterUserDto): Promise<TokenDto> {
    const user = await this.usersService.create({
      ...registerDto,
      password: await this.encryptionService.hashPassword(registerDto.password),
    });
    return this.generateToken(user);
  }

  async signIn(signInDto: SignInDto): Promise<TokenDto> {
    const user = await this.usersService.findOne(
      signInDto.username,
      signInDto.email,
    );
    if (
      !user ||
      !(await this.encryptionService.verifyPassword(
        signInDto.password,
        user.password,
      ))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
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
      role: user.role,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    await this.usersService.deleteUserById(userId);
  }
}
