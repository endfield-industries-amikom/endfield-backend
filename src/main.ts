import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyHelmet from '@fastify/helmet';

async function bootstrap() {
  const logger = new Logger('BackendService');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      bufferLogs: true,
    },
  );
  if (process.env.NODE_ENV === 'development') {
    const swagger = new DocumentBuilder()
      .setTitle('Endfield Backend')
      .setDescription('The Endfield Backend API')
      .setVersion('1.0')
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('api/docs', app, documentFactory);
  }
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https:`, `'unsafe-inline'`],
      },
    },
  });
  app.useLogger(logger);
  app.setGlobalPrefix('/api');
  app.enableShutdownHooks();

  // Transform Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  logger.debug(`Listening on port ${process.env.PORT ?? 3001}`);
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
void bootstrap();
