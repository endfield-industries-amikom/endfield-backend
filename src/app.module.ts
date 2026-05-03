import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResponsesModule } from './utils/responses/responses.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import ormConfig from './config/orm.config';
import ormConfigProd from './config/orm.config.prod';
import configuration from './config/configuration';
import { EncryptionModule } from './utils/encryption/encryption.module';

@Module({
  imports: [
    ResponsesModule,
    AuthModule,
    UsersModule,
    EncryptionModule,
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local', '.env.production.local', '.env'],
      load: [configuration],
      isGlobal: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory:
        process.env.NODE_ENV === 'production' ? ormConfigProd : ormConfig,
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
