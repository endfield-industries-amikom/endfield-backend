import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResponsesModule } from './utils/responses/responses.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import ormConfig from './config/orm.config';
import ormConfigProd from './config/orm.config.prod';
import configuration from './config/configuration';
import { EncryptionModule } from './utils/encryption/encryption.module';
import { RegionsModule } from './modules/region/regions.module';
import { WarehousesModule } from './modules/warehouse/warehouses.module';
import { ProductsModule } from './modules/product/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { StockMovementModule } from './modules/stock-movement/stock-movement.module';
import { ForecastModule } from './modules/forecast/forecast.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { PurchaseOrderModule } from './modules/purchase-order/purchase-order.module';
import { ShipmentModule } from './modules/shipment/shipment.module';
import { CustomersModule } from './modules/customer/customers.module';
import { SalesOrdersModule } from './modules/sales-order/sales-orders.module';
import { ProductionSchematicModule } from './modules/production-schematic/production-schematic.module';
import { ProductionSimulationModule } from './modules/production-simulation/production-simulation.module';
import { UploadModule } from './modules/upload/upload.module';
import { MaterialsModule } from './modules/material/materials.module';
import { OrderItemModule } from './modules/order-item/order-item.module';
import { ItemsModule } from './modules/item/items.module';
import { SessionMiddleware } from './common/middlewares/session.middleware';
import { AdminModule } from './admin/admin.module';
import { S3Module } from 'nestjs-s3';
import { fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ResponsesModule,
    AuthModule,
    UsersModule,
    RolesModule,
    EncryptionModule,
    RegionsModule,
    WarehousesModule,
    ProductsModule,
    InventoryModule,
    StockMovementModule,
    ForecastModule,
    SupplierModule,
    PurchaseOrderModule,
    ShipmentModule,
    CustomersModule,
    SalesOrdersModule,
    ProductionSchematicModule,
    ProductionSimulationModule,
    UploadModule,
    MaterialsModule,
    OrderItemModule,
    ItemsModule,
    AdminModule,
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
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    EventEmitterModule.forRoot(),
    S3Module.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        config: {
          credentials: fromTemporaryCredentials({
            masterCredentials: {
              accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID')!,
              secretAccessKey: configService.get<string>(
                'AWS_SECRET_ACCESS_KEY',
              )!,
            },
            params: {
              RoleArn: configService.get<string>('S3_IAM_ROLE_ARN')!,
              RoleSessionName: 'endfield-upload-session',
            },
          }),
          region: configService.get<string>('S3_REGION', 'us-east-1'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SessionMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
