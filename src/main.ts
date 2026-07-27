// Fix Node.js "happy eyeballs" dual-stack race condition on machines
// where IPv6 is configured but has no internet route (e.g. Neon DB).
// Without this, simultaneous IPv4/IPv6 connection attempts cause
// the IPv6 ENETUNREACH to abort the successful IPv4 connection.
import net from 'node:net';
net.setDefaultAutoSelectFamily(false);

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyMultipart from '@fastify/multipart';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { seed } from './database/seed';

async function bootstrap() {
  const logger = new Logger('BackendService');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: process.env.NODE_ENV === 'production' ? 'true' : 'false',
    }),
    {
      bufferLogs: true,
    },
  );

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';

  // Register Fastify plugins
  await app.register(fastifyCookie, {
    secret:
      configService.get<string>('COOKIE_SECRET') ||
      'default-cookie-secret-change-me-long-enough',
    parseOptions: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      domain: isProduction ? 'endfield.cydlab.my.id' : undefined,
    },
  });

  await app.register(fastifySession, {
    secret:
      configService.get<string>('SESSION_SECRET') ||
      'default-session-secret-change-me-long-enough',
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      domain: isProduction ? 'endfield.cydlab.my.id' : undefined,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    saveUninitialized: false,
  });

  await app.register(fastifyMultipart);

  // Swagger (development only)
  if (nodeEnv === 'development') {
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

  if (nodeEnv === "production") {
    app.enableCors({
      origin: ['https://endfield.cydlab.my.id', 'http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400,
    });
  } else {
    app.enableCors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400,
    });
  }

  // Global guards
  // JwtAuthGuard and RolesGuard are applied per-controller/endpoint via @UseGuards

  app.useLogger(logger);
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3001);

  // Seed the database before accepting traffic.
  await seedDatabase(logger);

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Backend listening on port ${port}`);
}

async function seedDatabase(logger: Logger) {
  const maxRetries = 5;
  const delayMs = 3000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await seed();
      logger.log('✅ Database seeded successfully');
      return;
    } catch (error) {
      logger.warn(
        `⚠️  Seed attempt ${attempt}/${maxRetries} failed: ${(error as Error).message}`,
      );
      if (attempt === maxRetries) {
        logger.error('❌ All seed attempts exhausted — starting without seed');
        return;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

void bootstrap();
