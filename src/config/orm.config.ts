import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default function ormConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const baseConfig = {
    type: 'postgres' as const,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,
    connectTimeoutMS: 15000,
    ssl: { rejectUnauthorized: false },
    enableChannelBinding: true,
  };

  if (configService.get<string>('DB_URL')) {
    return {
      ...baseConfig,
      url: configService.get<string>('DB_URL'),
    };
  }

  return {
    ...baseConfig,
    host: configService.get<string>('DB_HOST'),
    port: parseInt(configService.get<string>('DB_PORT') ?? '5432', 10),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
  };
}
