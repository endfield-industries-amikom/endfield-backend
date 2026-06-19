# Task Document: Inventory & Order Management System (Nest.js + Fastify)

## 1. Executive Summary

Build a secure, scalable REST API for a multi-region inventory and order management system. The application must support:

- Hybrid authentication: JWT (stateless) for API access + HttpOnly session cookie (server-side refresh token).
- Hardcoded role-based access (Admin, Manager, Viewer).
- Full CRUD for all ERD entities (Region, Warehouse, Product, Inventory, Stock Movement, Forecast, Supplier, Purchase Order, Shipment, Customer, Sales Order).
- Fastify as the underlying HTTP adapter.
- Swagger/OpenAPI documentation.

## 2. Technology Stack

| Layer            | Technology                              |
|------------------|-----------------------------------------|
| Framework        | Nest.js v10+                            |
| HTTP Adapter     | @nestjs/platform-fastify                |
| Database         | PostgreSQL (with TypeORM or Prisma)     |
| Auth             | @nestjs/jwt + @nestjs/session + bcrypt  |
| Session Store    | @fastify/session + @fastify/cookie (Redis or in-memory for development) |
| Validation       | class-validator + class-transformer     |
| Docs             | @nestjs/swagger                         |
| Testing          | Jest + Supertest                        |

## 3. Database Schema (Extended from ERD)

Add the following fields to the existing ERD:

### 3.1. USER Table (additions)

```sql
ALTER TABLE USER ADD COLUMN password_hash VARCHAR(255) NOT NULL;
ALTER TABLE USER ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE USER ADD COLUMN last_login TIMESTAMP;
```

### 3.2. ROLE Table (hardcoded roles)

```sql
INSERT INTO ROLE (role_id, role_name) VALUES 
(1, 'Admin'),
(2, 'Manager'),
(3, 'Viewer');
```

### 3.3. PERMISSION Table (optional – for future extensibility, but not used now)

Will be skipped – permissions are hardcoded in guards.

## 4. Authentication & Authorization Strategy

### 4.1. Hybrid Auth Flow (Option C)

**Login flow:**

1. Client sends `POST /auth/login` with email + password.
2. Server verifies credentials (bcrypt compare).
3. On success:
   - Generate Access Token (JWT, short-lived, e.g., 15 min) → returned in response body.
   - Generate Refresh Token (UUID or JWT, longer-lived, e.g., 7 days) → stored in server-side session (HttpOnly, Secure, SameSite=Strict).
   - Set session cookie (refresh_token).
4. Client stores JWT (e.g., localStorage) and uses `Authorization: Bearer <jwt>` for API calls.

**Refresh flow:**

1. Client calls `POST /auth/refresh` without headers.
2. Server reads the `refresh_token` cookie.
3. Validates session existence and expiry.
4. If valid → issues a new JWT (access token) and returns it in response body.
5. If invalid → returns 401.

**Logout flow:**

1. Client calls `POST /auth/logout`.
2. Server destroys the session and clears the cookie.

### 4.2. Cookie Configuration

```typescript
{
  httpOnly: true,
  secure: true, // production only
  sameSite: 'strict',
  domain: 'endfield.cydlab.my.id',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}
```

### 4.3. Hardcoded RBAC

| Role    | Permissions                                                                                   |
|---------|-----------------------------------------------------------------------------------------------|
| Admin   | Full access to all endpoints                                                                  |
| Manager | Can CRUD Regions, Warehouses, Products, Inventory, Stock Movements, Forecasts, Suppliers, Purchase Orders, Shipments, Customers, Sales Orders |
| Viewer  | Read-only access to all entities (GET only)                                                   |

Guard implementation: Use NestJS `@Roles()` decorator with custom `RolesGuard`.

## 5. Project Structure

```
src/
├── auth/                     # Authentication module
│   ├── dto/
│   ├── guards/               # JwtGuard, RolesGuard
│   ├── strategies/           # JwtStrategy, SessionStrategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── common/
│   ├── filters/              # Global exception filters
│   ├── interceptors/         # Logging, transform
│   └── middlewares/          # Fastify session config
├── modules/                  # Feature modules (one per entity group)
│   ├── region/
│   ├── warehouse/
│   ├── product/
│   ├── inventory/
│   ├── stock-movement/
│   ├── forecast/
│   ├── supplier/
│   ├── purchase-order/
│   ├── shipment/
│   ├── customer/
│   └── sales-order/
├── database/                 # TypeORM/Prisma entities & migrations
├── config/                   # App config (JWT, session, DB)
├── main.ts                   # Fastify adapter setup
└── app.module.ts
```

## 6. API Endpoint Design (All Entities)

Each module will expose standard REST endpoints:

### Generic CRUD Pattern (for all entities)

| Method | Endpoint               | Description        | Roles      |
|--------|------------------------|--------------------|------------|
| GET    | /api/v1/{entity}       | List all (paginated) | Viewer+  |
| GET    | /api/v1/{entity}/:id   | Get by ID          | Viewer+    |
| POST   | /api/v1/{entity}       | Create new         | Manager+   |
| PATCH  | /api/v1/{entity}/:id   | Update             | Manager+   |
| DELETE | /api/v1/{entity}/:id   | Delete             | Admin only |

### Special Endpoints (per entity logic)

| Entity         | Endpoint                                            | Description                     |
|----------------|-----------------------------------------------------|---------------------------------|
| Inventory      | `PATCH /inventory/:id/reserve`                      | Reserve stock                   |
| Inventory      | `PATCH /inventory/:id/restock`                      | Add stock                       |
| Stock Movement | `GET /stock-movement/warehouse/:warehouseId`        | List movements by warehouse     |
| Purchase Order | `POST /purchase-order/:poId/approve`                | Approve (only Admin)            |
| Sales Order    | `POST /sales-order/:orderId/ship`                   | Triggers shipment               |
| Forecast       | `GET /forecast/region/:regionId`                    | Get forecasts by region         |
| User Management| `GET /users/me`                                     | Current user                    |
| User Management| `PATCH /users/me`                                   | Update profile                  |

## 7. Fastify-Specific Configuration

### 7.1. Main.ts Setup

```typescript
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Register Fastify plugins
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET,
    parseOptions: { httpOnly: true, secure: true, sameSite: 'strict', domain: 'endfield.cydlab.my.id' },
  });

  await app.register(fastifySession, {
    secret: process.env.SESSION_SECRET,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      domain: 'endfield.cydlab.my.id',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    saveUninitialized: false,
    resave: false,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Inventory Management API')
    .setDescription('Hybrid JWT + Session Auth')
    .setVersion('1.0')
    .addBearerAuth() // for JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors({
    origin: ['https://endfield.cydlab.my.id', 'http://localhost:3000'],
    credentials: true, // allow cookies
  });

  await app.listen(3000);
}
bootstrap();
```

### 7.2. Session Middleware Configuration (in app.module.ts)

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SessionMiddleware } from './common/middlewares/session.middleware';

@Module({ ... })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('*');
  }
}
```

## 8. Auth Module Detailed Implementation

### 8.1. AuthService

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      return user;
    }
    return null;
  }

  async login(user: User, session: any): Promise<{ access_token: string }> {
    const payload = { sub: user.user_id, email: user.email, role: user.role_id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Store refresh token in session
    session.refreshToken = crypto.randomUUID();
    session.userId = user.user_id;
    session.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return { access_token: accessToken };
  }

  async refresh(session: any): Promise<{ access_token: string }> {
    if (!session.refreshToken || new Date() > session.expires) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    const user = await this.userRepo.findOne({ where: { user_id: session.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const payload = { sub: user.user_id, email: user.email, role: user.role_id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    return { access_token: accessToken };
  }
}
```

### 8.2. AuthController

```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Session() session: any) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user, session);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Session() session: any) {
    return this.authService.refresh(session);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Session() session: any) {
    session.destroy();
  }
}
```

### 8.3. Guards

- **JwtAuthGuard** – validates `Authorization: Bearer` header.
- **RolesGuard** – checks `@Roles('Admin', 'Manager')` decorator and compares with `user.role_id`.

## 9. Entity Mappings (TypeORM Example)

All entities must include:

- `@PrimaryGeneratedColumn()`
- Proper relations (`@ManyToOne`, `@OneToMany`)
- Timestamps (`@CreateDateColumn`, `@UpdateDateColumn`)

### Example: User Entity

```typescript
@Entity('USER')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  id: number;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'role_id' })
  roleId: number;

  @Column({ name: 'region_id', nullable: true })
  regionId: number;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Region)
  @JoinColumn({ name: 'region_id' })
  region: Region;
}
```

## 10. Validation & DTOs

Create DTOs for each endpoint:

- `CreateUserDto`, `UpdateUserDto`, `LoginDto`, etc.
- Use `class-validator` decorators: `@IsEmail()`, `@MinLength(8)`, `@IsInt()`, `@IsNotEmpty()`.

## 11. Error Handling & Logging

- Global exception filter (`HttpExceptionFilter`) to standardize error responses.
- Logger (NestJS built-in or winston) for audit logs (login attempts, stock adjustments).
- Return standard JSON error format:

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "timestamp": "2026-06-18T10:00:00Z",
  "path": "/auth/login"
}
```

## 12. Security Considerations

| Aspect              | Implementation                                                   |
|---------------------|------------------------------------------------------------------|
| Password hashing    | bcrypt (salt rounds 12)                                          |
| JWT                 | @nestjs/jwt with RSA256 or HS256 (use environment variable)      |
| Session cookie      | HttpOnly, Secure, SameSite=Strict, domain restricted             |
| Rate limiting       | @nestjs/throttler (e.g., 100 requests per minute)                |
| CORS                | Whitelist only endfield.cydlab.my.id                             |
| Input sanitization  | Validation pipes + helmet for Fastify                            |
| SQL Injection       | ORM (TypeORM) handles parameterization                           |
| XSS                 | Cookie flags + output encoding                                   |

## 13. Testing Strategy

| Type               | Tools            | Scope                                     |
|--------------------|------------------|-------------------------------------------|
| Unit tests         | Jest             | Services, guards, validation              |
| Integration tests  | Supertest        | Controllers                               |
| E2E tests          | Jest + Supertest | Full auth flow (login → JWT → refresh → logout) |
| Mocking            | Jest             | TypeORM Repository mocks                  |

## 14. Implementation Roadmap (Phases)

| Phase                   | Duration | Deliverables                                                        |
|-------------------------|----------|---------------------------------------------------------------------|
| Phase 1: Foundation     | 2 days   | Project setup, Fastify, TypeORM, environment config, basic User/Role entities |
| Phase 2: Auth Module    | 3 days   | JWT + Session hybrid (cookie), guards, roles, login/refresh/logout  |
| Phase 3: Core Entities  | 5 days   | Region, Warehouse, Product, Inventory, Stock Movement (CRUD + relations) |
| Phase 4: Supply Chain   | 4 days   | Supplier, Purchase Order, Shipment, Forecast                        |
| Phase 5: Sales          | 3 days   | Customer, Sales Order, Order Details                                |
| Phase 6: Docs & Testing | 2 days   | Swagger, unit tests, integration tests, final polish                |
| **Total**               | **19 days** |                                                                     |

## 15. Environment Variables (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secret
DB_NAME=inventory_db

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=15m

# Session
SESSION_SECRET=your_session_secret
COOKIE_SECRET=your_cookie_secret

# App
APP_DOMAIN=endfield.cydlab.my.id
NODE_ENV=production
```

## 16. Deliverables Checklist

- [x] Fully functional REST API with all ERD entities (11 modules: Region, Warehouse, Product, Inventory, StockMovement, Forecast, Supplier, PurchaseOrder, Shipment, Customer, SalesOrder)
- [x] Hybrid auth (JWT access + session refresh cookie) - 
  - `POST /auth/login` stores refresh token in server-side session
  - `POST /auth/refresh` reads session and issues new JWT
  - `POST /auth/logout` destroys session
  - Fastify Cookie + Session plugins registered in main.ts
- [x] Hardcoded RBAC (Admin, Employee, Consumer) - @Roles() decorator + RolesGuard
  - **Admin**: Full access to all endpoints
  - **Employee**: Stocks (inventory, stock-movement), purchase orders, products CRUD; read-only suppliers/warehouses/regions/forecast
  - **Consumer**: Create sales orders, view shipments, view customers, view products
- [x] Swagger documentation at `/api/docs`
- [ ] Unit tests (≥80% coverage) - 5 tests pass, need more coverage
- [ ] E2E auth flow test - placeholder e2e exists, needs full auth flow test
- [x] Production-ready Fastify setup with session & cookie - 
  - @fastify/cookie + @fastify/session registered
  - Helmet, CORS, ValidationPipe, global exception filter
  - Rate limiting (ThrottlerModule)
- [x] Database migrations & seed - Seed script at `src/database/seed.ts` (`npm run db:seed`)
  - Seeds roles: Admin, Employee, Consumer
  - Seeds default admin: endmin@endfield.com / endmin (password)
- [x] Error handling and logging - Global HttpExceptionFilter with standardized JSON error format (statusCode, message, timestamp, path)