import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default function ormConfigProd(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: parseInt(configService.get<string>('DB_PORT') ?? '5432', 10),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
    ssl: true,
  };
}
