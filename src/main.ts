import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('BackendService');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      bufferLogs: true,
    },
  );

  // Register Fastify plugins
  await app.register(fastifyCookie, {
    secret:
      process.env.COOKIE_SECRET ||
      'default-cookie-secret-change-me-long-enough',
    parseOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      domain:
        process.env.NODE_ENV === 'production'
          ? 'endfield.cydlab.my.id'
          : undefined,
    },
  });

  await app.register(fastifySession, {
    secret:
      process.env.SESSION_SECRET ||
      'default-session-secret-change-me-long-enough',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      domain:
        process.env.NODE_ENV === 'production'
          ? 'endfield.cydlab.my.id'
          : undefined,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    saveUninitialized: false,
  });

  // Swagger (development only)
  if (process.env.NODE_ENV === 'development') {
    const swagger = new DocumentBuilder()
      .setTitle('Endfield Backend')
      .setDescription(
        'Inventory & Order Management System - Hybrid JWT + Session Auth',
      )
      .addBearerAuth(
        {
          name: 'Authorization',
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'bearer',
      )
      .addSecurityRequirements('bearer')
      .setVersion('1.0')
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('api/docs', app, documentFactory);
  }

  // Security
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

  // Global prefix
  app.setGlobalPrefix('/api/v1');

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global guards
  // JwtAuthGuard and RolesGuard are applied per-controller/endpoint via @UseGuards

  app.useLogger(logger);
  app.enableShutdownHooks();
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'development'
        ? '*'
        : ['https://endfield.cydlab.my.id', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  });

  const port = process.env.PORT ?? 3001;
  logger.debug(`Listening on port ${port}`);
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
