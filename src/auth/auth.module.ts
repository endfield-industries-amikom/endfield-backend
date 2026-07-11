import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/modules/customer/customer.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Customer]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (() => {
            const expiresIn =
              configService.get<string>('JWT_EXPIRES_IN') ?? '1h';
            return /^\d+$/.test(expiresIn)
              ? Number(expiresIn)
              : (expiresIn as StringValue);
          })(),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
