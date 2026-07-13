import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

/* ------------------------------------------------------------------ */
/*  Endfield Backend — full E2E test suite                             */
/*  Covers auth flow + CRUD on all 15 feature modules (SPEC flow).    */
/*  Requires: seeded DB (roles + admin user).                          */
/*  Run:     npm run db:seed && npm run test:e2e                       */
/* ------------------------------------------------------------------ */

describe('Endfield Backend (e2e)', () => {
  let app: NestFastifyApplication;
  let adminToken: string;
  let adminCookies: string[];

  // ── cross-module ID references ────────────────────────────────────
  let regionId: string;
  let warehouseId: string;
  let productId: string;
  let itemId: string;
  let materialId: string;
  let supplierId: string;
  let customerId: string;
  let purchaseOrderId: string;
  let salesOrderId: string;
  let shipmentId: string;
  let consumerToken: string;

  /* ================================================================== */
  /*  Setup / Teardown                                                    */
  /* ================================================================== */

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    // Mirror main.ts global config
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Register Fastify plugins (same as main.ts bootstrap)
    const instance = app.getHttpAdapter().getInstance();
    await instance.register(fastifyCookie, {
      secret: 'test-cookie-secret-change-me-long-enough',
      parseOptions: { httpOnly: true, secure: false, sameSite: 'strict' },
    });
    await instance.register(fastifySession, {
      secret: 'test-session-secret-change-me-long-enough',
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
      saveUninitialized: false,
    });

    await instance.ready();

    // Authenticate as the seeded admin user
    const res = await request(app.getHttpServer() as App)
      .post('/api/v1/auth/login')
      .send({ email: 'endmin@endfield.com', password: 'endminStrongPassword' })
      .expect(200);

    adminToken = res.body.data.access_token;
    const rawCookies = res.headers['set-cookie'];
    adminCookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  /* ================================================================== */
  /*  1. AUTH                                                            */
  /* ================================================================== */

  describe('Auth', () => {
    const testUser = {
      username: `e2euser_${Date.now()}`,
      email: `e2e_${Date.now()}@test.com`,
      password: 'TestPass123!',
    };

    describe('POST /auth/register', () => {
      it('should register a new Consumer user', async () => {
        const res = await request(app.getHttpServer() as App)
          .post('/api/v1/auth/register')
          .send(testUser)
          .expect(201);

        expect(res.body.statusCode).toBe(201);
        expect(res.body.data).toHaveProperty('access_token');
        expect(res.body.data.user.email).toBe(testUser.email);
        expect(res.body.data.user.role).toBe('Consumer');
        consumerToken = res.body.data.access_token;
      });

      it('should return 400 for duplicate email', async () => {
        await request(app.getHttpServer() as App)
          .post('/api/v1/auth/register')
          .send(testUser)
          .expect(400);
      });

      it('should return 400 for missing fields', async () => {
        await request(app.getHttpServer() as App)
          .post('/api/v1/auth/register')
          .send({ username: 'noemail' })
          .expect(400);
      });

      it('should return 400 for short password', async () => {
        await request(app.getHttpServer() as App)
          .post('/api/v1/auth/register')
          .send({ username: 'x', email: 'x@x.com', password: '123' })
          .expect(400);
      });
    });

    describe('POST /auth/login', () => {
      it('should login with email and return JWT + session cookie', async () => {
        const res = await request(app.getHttpServer() as App)
          .post('/api/v1/auth/login')
          .send({ email: 'endmin@endfield.com', password: 'endminStrongPassword' })
          .expect(200);

        expect(res.body.data).toHaveProperty('access_token');
        expect(res.body.data.user.role).toBe('Admin');
        expect(res.headers['set-cookie']).toBeDefined();
      });

      it('should return 401 for invalid credentials', async () => {
        await request(app.getHttpServer() as App)
          .post('/api/v1/auth/login')
          .send({ email: 'endmin@endfield.com', password: 'wrong' })
          .expect(401);
      });

      it('should return 400 for missing password', async () => {
        await request(app.getHttpServer() as App)
          .post('/api/v1/auth/login')
          .send({ email: 'endmin@endfield.com' })
          .expect(400);
      });
    });

    describe('POST /auth/refresh', () => {
      it('should refresh token with valid session cookie', async () => {
        const res = await request(app.getHttpServer() as App)
          .post('/api/v1/auth/refresh')
          .set('Cookie', adminCookies)
          .expect(200);

        expect(res.body.data).toHaveProperty('access_token');
      });

      it('should return 401 without session cookie', async () => {
        await request(app.getHttpServer() as App)
          .post('/api/v1/auth/refresh')
          .expect(401);
      });
    });

    describe('GET /auth/profile', () => {
      it('should return profile with valid JWT', async () => {
        const res = await request(app.getHttpServer() as App)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body.data.email).toBe('endmin@endfield.com');
      });

      it('should return 401 without token', async () => {
        await request(app.getHttpServer() as App)
          .get('/api/v1/auth/profile')
          .expect(401);
      });
    });

    describe('POST /auth/logout', () => {
      it('should logout and clear session', async () => {
        await request(app.getHttpServer() as App)
          .post('/api/v1/auth/logout')
          .set('Cookie', adminCookies)
          .expect(204);
      });
    });
  });

  /* ================================================================== */
  /*  2. REGIONS                                                         */
  /* ================================================================== */

  describe('Regions', () => {
    const auth = () => ({ Authorization: `Bearer ${adminToken}` });

    it('POST /region — create', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/region')
        .set(auth())
        .send({ name: 'E2E Region', code: 'E2E-R', description: 'Test region' })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('E2E Region');
      regionId = res.body.data.id;
    });

    it('GET /region — list with pagination', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/region')
        .set(auth())
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('total');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('GET /region/:id — get by id', async () => {
      const res = await request(app.getHttpServer() as App)
        .get(`/api/v1/region/${regionId}`)
        .set(auth())
        .expect(200);

      expect(res.body.data.name).toBe('E2E Region');
    });

    it('PATCH /region/:id — update', async () => {
      const res = await request(app.getHttpServer() as App)
        .patch(`/api/v1/region/${regionId}`)
        .set(auth())
        .send({ name: 'E2E Region Updated' })
        .expect(200);

      expect(res.body.data.name).toBe('E2E Region Updated');
    });

    it('DELETE /region/:id — delete', async () => {
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/region/${regionId}`)
        .set(auth())
        .expect(200);
    });
  });

  /* ================================================================== */
  /*  3. WAREHOUSES                                                      */
  /* ================================================================== */

  describe('Warehouses', () => {
    const auth = () => ({ Authorization: `Bearer ${adminToken}` });

    beforeAll(async () => {
      // Create a region for warehouse tests
      const r = await request(app.getHttpServer() as App)
        .post('/api/v1/region')
        .set(auth())
        .send({ name: 'Warehouse Region', code: 'WH-R' });
      regionId = r.body.data.id;
    });

    it('POST /warehouses — create', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/warehouses')
        .set(auth())
        .send({
          name: 'E2E Warehouse',
          code: 'E2E-WH',
          address: '123 Test St',
          regionId,
        })
        .expect(201);

      expect(res.body.data.name).toBe('E2E Warehouse');
      warehouseId = res.body.data.id;
    });

    it('GET /warehouses — list', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/warehouses')
        .set(auth())
        .expect(200);

      expect(res.body.data).toHaveProperty('data');
    });

    it('GET /warehouses/:id — get by id', async () => {
      const res = await request(app.getHttpServer() as App)
        .get(`/api/v1/warehouses/${warehouseId}`)
        .set(auth())
        .expect(200);

      expect(res.body.data.code).toBe('E2E-WH');
    });

    it('PATCH /warehouses/:id — update', async () => {
      const res = await request(app.getHttpServer() as App)
        .patch(`/api/v1/warehouses/${warehouseId}`)
        .set(auth())
        .send({ name: 'E2E Warehouse Updated' })
        .expect(200);

      expect(res.body.data.name).toBe('E2E Warehouse Updated');
    });

    it('DELETE /warehouses/:id — delete', async () => {
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/warehouses/${warehouseId}`)
        .set(auth())
        .expect(200);
    });

    afterAll(async () => {
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/region/${regionId}`)
        .set(auth());
    });
  });

  /* ================================================================== */
  /*  4. PRODUCTS                                                        */
  /* ================================================================== */

  describe('Products', () => {
    const auth = () => ({ Authorization: `Bearer ${adminToken}` });

    it('POST /product — create', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/product')
        .set(auth())
        .send({
          name: 'E2E Product',
          sku: `E2E-PROD-${Date.now()}`,
          description: 'Test product for e2e',
          category: 'Test',
          type: 'product',
          unitPrice: 99.99,
          capacityUsage: 1.5,
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('itemId');
      expect(res.body.data.type).toBe('product');
      productId = res.body.data.id;
      itemId = res.body.data.itemId;
    });

    it('GET /product — list with pagination', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/product')
        .set(auth())
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('totalPages');
    });

    it('GET /product/:id — get by id', async () => {
      const res = await request(app.getHttpServer() as App)
        .get(`/api/v1/product/${productId}`)
        .set(auth())
        .expect(200);

      expect(res.body.data.item.sku).toContain('E2E-PROD-');
    });

    it('PATCH /product/:id — update', async () => {
      const res = await request(app.getHttpServer() as App)
        .patch(`/api/v1/product/${productId}`)
        .set(auth())
        .send({ name: 'E2E Product Updated', unitPrice: 149.99 })
        .expect(200);

      expect(res.body.data.item.name).toBe('E2E Product Updated');
    });

    it('GET /product/top-selling — top products', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/product/top-selling')
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 400 when SKU is missing', async () => {
      await request(app.getHttpServer() as App)
        .post('/api/v1/product')
        .set(auth())
        .send({ name: 'No SKU', unitPrice: 10 })
        .expect(400);
    });

    it('DELETE /product/:id — delete', async () => {
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/product/${productId}`)
        .set(auth())
        .expect(200);
    });
  });

  /* ================================================================== */
  /*  5. MATERIALS (raw materials)                                        */
  /* ================================================================== */

  describe('Materials', () => {
    const auth = () => ({ Authorization: `Bearer ${adminToken}` });

    it('POST /material — create', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/material')
        .set(auth())
        .send({
          name: 'E2E Raw Material',
          sku: `E2E-MAT-${Date.now()}`,
          description: 'Test material',
          category: 'Raw',
          unit: 'kg',
          unitPrice: 25.5,
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('itemId');
      expect(res.body.data.itemId).toBeDefined();
      materialId = res.body.data.id;
    });

    it('GET /material — list', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/material')
        .set(auth())
        .expect(200);

      expect(res.body.data).toHaveProperty('data');
    });

    it('GET /material/:id — get by id', async () => {
      const res = await request(app.getHttpServer() as App)
        .get(`/api/v1/material/${materialId}`)
        .set(auth())
        .expect(200);

      expect(res.body.data.item.unitPrice).toBeDefined();
    });

    it('PATCH /material/:id — update', async () => {
      const res = await request(app.getHttpServer() as App)
        .patch(`/api/v1/material/${materialId}`)
        .set(auth())
        .send({ unitPrice: 30.0 })
        .expect(200);

      expect(res.body.data.item.unitPrice).toBe('30.00');
    });
  });

  /* ================================================================== */
  /*  6. SUPPLIERS                                                       */
  /* ================================================================== */

  describe('Suppliers', () => {
    const auth = () => ({ Authorization: `Bearer ${adminToken}` });

    it('POST /supplier — create', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/supplier')
        .set(auth())
        .send({
          name: 'E2E Supplier Inc.',
          code: `E2E-SUP-${Date.now()}`,
          contactPerson: 'John Doe',
          email: 'supplier@e2e.com',
          phone: '555-0100',
          address: '456 Vendor Rd',
        })
        .expect(201);

      expect(res.body.data.name).toBe('E2E Supplier Inc.');
      supplierId = res.body.data.id;
    });

    it('GET /supplier — list', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/supplier')
        .set(auth())
        .expect(200);

      expect(res.body.data).toHaveProperty('data');
    });

    it('GET /supplier/:id — get by id', async () => {
      await request(app.getHttpServer() as App)
        .get(`/api/v1/supplier/${supplierId}`)
        .set(auth())
        .expect(200);
    });

    it('PATCH /supplier/:id — update', async () => {
      const res = await request(app.getHttpServer() as App)
        .patch(`/api/v1/supplier/${supplierId}`)
        .set(auth())
        .send({ phone: '555-0200' })
        .expect(200);

      expect(res.body.data.phone).toBe('555-0200');
    });
  });

  /* ================================================================== */
  /*  7. CUSTOMERS                                                       */
  /* ================================================================== */

  describe('Customers', () => {
    const auth = () => ({ Authorization: `Bearer ${adminToken}` });

    it('POST /customers — create', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/customers')
        .set(auth())
        .send({
          name: 'E2E Customer',
          code: `E2E-CUST-${Date.now()}`,
          email: 'customer@e2e.com',
          phone: '555-0300',
          address: '789 Buyer Ln',
        })
        .expect(201);

      customerId = res.body.data.id;
    });

    it('GET /customers — list', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/customers')
        .set(auth())
        .expect(200);

      expect(res.body.data).toHaveProperty('data');
    });

    it('GET /customers/:id — get by id', async () => {
      await request(app.getHttpServer() as App)
        .get(`/api/v1/customers/${customerId}`)
        .set(auth())
        .expect(200);
    });

    it('GET /customers/me — own profile (Consumer)', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/customers/me')
        .set('Authorization', `Bearer ${consumerToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
    });

    it('PATCH /customers/:id — update (Admin)', async () => {
      await request(app.getHttpServer() as App)
        .patch(`/api/v1/customers/${customerId}`)
        .set(auth())
        .send({ phone: '555-0400' })
        .expect(200);
    });
  });

  /* ================================================================== */
  /*  8. INVENTORY                                                       */
  /* ================================================================== */

  describe('Inventory', () => {
    const auth = () => ({ Authorization: `Bearer ${adminToken}` });

    beforeAll(async () => {
      // Re-create region + warehouse + product for inventory linking
      const r = await request(app.getHttpServer() as App)
        .post('/api/v1/region')
        .set(auth())
        .send({ name: 'Inv Region', code: 'INV-R' });
      regionId = r.body.data.id;

      const w = await request(app.getHttpServer() as App)
        .post('/api/v1/warehouses')
        .set(auth())
        .send({ name: 'Inv Warehouse', code: 'INV-WH', address: 'X', regionId });
      warehouseId = w.body.data.id;

      const p = await request(app.getHttpServer() as App)
        .post('/api/v1/product')
        .set(auth())
        .send({ name: 'Inv Product', sku: `INV-P-${Date.now()}`, unitPrice: 50 });
      productId = p.body.data.id;
      itemId = p.body.data.itemId;
    });

    it('Inventories are created automatically on shipment arrival — cannot POST', async () => {
      await request(app.getHttpServer() as App)
        .post('/api/v1/inventory')
        .set(auth())
        .send({
          warehouseId,
          itemId,
          quantityOnHand: 100,
        })
        .expect(404); // POST endpoint removed
    });

    it('GET /inventory — list', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/inventory')
        .set(auth())
        .expect(200);

      expect(res.body.data).toHaveProperty('data');
    });

    afterAll(async () => {
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/product/${productId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/warehouses/${warehouseId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/region/${regionId}`)
        .set(auth());
    });
  });

  /* ================================================================== */
  /*  9. PURCHASE ORDERS                                                 */
  /* ================================================================== */

  describe('Purchase Orders', () => {
    const auth = () => ({ Authorization: `Bearer ${adminToken}` });

    beforeAll(async () => {
      // Setup dependencies: region → warehouse → supplier → product
      const r = await request(app.getHttpServer() as App)
        .post('/api/v1/region')
        .set(auth())
        .send({ name: 'PO Region', code: 'PO-R' });
      regionId = r.body.data.id;

      const w = await request(app.getHttpServer() as App)
        .post('/api/v1/warehouses')
        .set(auth())
        .send({ name: 'PO Warehouse', code: 'PO-WH', address: 'Y', regionId });
      warehouseId = w.body.data.id;

      const s = await request(app.getHttpServer() as App)
        .post('/api/v1/supplier')
        .set(auth())
        .send({ name: 'PO Supplier', code: `PO-SUP-${Date.now()}`, email: 'po@e2e.com' });
      supplierId = s.body.data.id;

      const p = await request(app.getHttpServer() as App)
        .post('/api/v1/product')
        .set(auth())
        .send({ name: 'PO Product', sku: `PO-P-${Date.now()}`, unitPrice: 30 });
      productId = p.body.data.id;
    });

    it('POST /purchase-order — create', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/purchase-order')
        .set(auth())
        .send({
          supplierId,
          warehouseId,
          totalAmount: 3000,
          notes: 'E2E test PO',
        })
        .expect(201);

      expect(res.body.data.order.status).toBe('PENDING');
      purchaseOrderId = res.body.data.orderId;
    });

    it('GET /purchase-order — list', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/purchase-order')
        .set(auth())
        .expect(200);

      expect(res.body.data).toHaveProperty('data');
    });

    it('GET /purchase-order/:id — get by id', async () => {
      await request(app.getHttpServer() as App)
        .get(`/api/v1/purchase-order/${purchaseOrderId}`)
        .set(auth())
        .expect(200);
    });

    it('POST /purchase-order/:poId/approve — approve', async () => {
      const res = await request(app.getHttpServer() as App)
        .post(`/api/v1/purchase-order/${purchaseOrderId}/approve`)
        .set(auth())
        .expect(200);

      expect(res.body.data.order.status).toBe('APPROVED');
    });

    it('PATCH /purchase-order/:id — update', async () => {
      await request(app.getHttpServer() as App)
        .patch(`/api/v1/purchase-order/${purchaseOrderId}`)
        .set(auth())
        .send({ notes: 'Updated notes' })
        .expect(200);
    });

    afterAll(async () => {
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/purchase-order/${purchaseOrderId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/product/${productId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/supplier/${supplierId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/warehouses/${warehouseId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/region/${regionId}`)
        .set(auth());
    });
  });

  /* ================================================================== */
  /*  10. SALES ORDERS                                                   */
  /* ================================================================== */

  describe('Sales Orders', () => {
    const auth = () => ({ Authorization: `Bearer ${adminToken}` });

    beforeAll(async () => {
      const r = await request(app.getHttpServer() as App)
        .post('/api/v1/region')
        .set(auth())
        .send({ name: 'SO Region', code: 'SO-R' });
      regionId = r.body.data.id;

      const w = await request(app.getHttpServer() as App)
        .post('/api/v1/warehouses')
        .set(auth())
        .send({ name: 'SO Warehouse', code: 'SO-WH', address: 'Z', regionId });
      warehouseId = w.body.data.id;

      const c = await request(app.getHttpServer() as App)
        .post('/api/v1/customers')
        .set(auth())
        .send({ name: 'SO Customer', code: `SO-CUST-${Date.now()}`, email: 'so@e2e.com' });
      customerId = c.body.data.id;

      const p = await request(app.getHttpServer() as App)
        .post('/api/v1/product')
        .set(auth())
        .send({ name: 'SO Product', sku: `SO-P-${Date.now()}`, unitPrice: 60 });
      productId = p.body.data.id;
      itemId = p.body.data.itemId;
    });

    it('POST /sales-order — create', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/sales-order')
        .set(auth())
        .send({
          customerId,
          warehouseId,
          totalAmount: 600,
          notes: 'E2E test SO',
          items: [{ itemId, quantity: 5, unitPrice: 60 }],
        })
        .expect(201);

      expect(res.body.data.order.status).toBe('PENDING');
      salesOrderId = res.body.data.orderId;
    });

    it('GET /sales-order — list', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/sales-order')
        .set(auth())
        .expect(200);

      expect(res.body.data).toHaveProperty('data');
    });

    it('GET /sales-order/:id — get by id', async () => {
      await request(app.getHttpServer() as App)
        .get(`/api/v1/sales-order/${salesOrderId}`)
        .set(auth())
        .expect(200);
    });

    it('PATCH /sales-order/:id — update', async () => {
      await request(app.getHttpServer() as App)
        .patch(`/api/v1/sales-order/${salesOrderId}`)
        .set(auth())
        .send({ notes: 'SO notes updated' })
        .expect(200);
    });

    afterAll(async () => {
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/sales-order/${salesOrderId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/product/${productId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/customers/${customerId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/warehouses/${warehouseId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/region/${regionId}`)
        .set(auth());
    });
  });

  /* ================================================================== */
  /*  11. SHIPMENTS                                                      */
  /* ================================================================== */

  describe('Shipments', () => {
    const auth = () => ({ Authorization: `Bearer ${adminToken}` });

    beforeAll(async () => {
      // Need purchase order + supplier + warehouse + region
      const r = await request(app.getHttpServer() as App)
        .post('/api/v1/region')
        .set(auth())
        .send({ name: 'Ship Region', code: 'SH-R' });
      regionId = r.body.data.id;

      const w = await request(app.getHttpServer() as App)
        .post('/api/v1/warehouses')
        .set(auth())
        .send({ name: 'Ship Warehouse', code: 'SH-WH', address: 'Dock', regionId });
      warehouseId = w.body.data.id;

      const s = await request(app.getHttpServer() as App)
        .post('/api/v1/supplier')
        .set(auth())
        .send({ name: 'Ship Supplier', code: `SH-SUP-${Date.now()}`, email: 'ship@e2e.com' });
      supplierId = s.body.data.id;

      const po = await request(app.getHttpServer() as App)
        .post('/api/v1/purchase-order')
        .set(auth())
        .send({ supplierId, warehouseId, totalAmount: 1000 });
      purchaseOrderId = po.body.data.id;
    });

    it('POST /shipment — create', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/shipment')
        .set(auth())
        .send({
          orderType: 'PURCHASE',
          orderId: purchaseOrderId,
          carrier: 'E2E Courier',
          trackingNumber: `E2E-TRK-${Date.now()}`,
          notes: 'E2E test shipment',
        })
        .expect(201);

      expect(res.body.data.carrier).toBe('E2E Courier');
      expect(res.body.data.orderType).toBe('PURCHASE');
      shipmentId = res.body.data.id;
    });

    it('GET /shipment — list', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/shipment')
        .set(auth())
        .expect(200);

      expect(res.body.data).toHaveProperty('data');
    });

    it('GET /shipment/:id — get by id', async () => {
      await request(app.getHttpServer() as App)
        .get(`/api/v1/shipment/${shipmentId}`)
        .set(auth())
        .expect(200);
    });

    it('PATCH /shipment/:id — update', async () => {
      await request(app.getHttpServer() as App)
        .patch(`/api/v1/shipment/${shipmentId}`)
        .set(auth())
        .send({ notes: 'Shipment notes updated' })
        .expect(200);
    });

    afterAll(async () => {
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/shipment/${shipmentId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/purchase-order/${purchaseOrderId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/supplier/${supplierId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/warehouses/${warehouseId}`)
        .set(auth());
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/region/${regionId}`)
        .set(auth());
    });
  });

  /* ================================================================== */
  /*  12. ROLE-BASED ACCESS CONTROL                                      */
  /* ================================================================== */

  describe('Role-Based Access', () => {
    it('Consumer cannot create products', async () => {
      await request(app.getHttpServer() as App)
        .post('/api/v1/product')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ name: 'x', sku: 'X', unitPrice: 1 })
        .expect(403);
    });

    it('Consumer can view products', async () => {
      await request(app.getHttpServer() as App)
        .get('/api/v1/product')
        .set('Authorization', `Bearer ${consumerToken}`)
        .expect(200);
    });

    it('Consumer cannot access inventory', async () => {
      await request(app.getHttpServer() as App)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${consumerToken}`)
        .expect(403);
    });

    it('Unauthenticated user cannot access protected routes', async () => {
      await request(app.getHttpServer() as App)
        .get('/api/v1/product')
        .expect(401);
    });
  });

  /* ================================================================== */
  /*  13. VALIDATION                                                     */
  /* ================================================================== */

  describe('Validation', () => {
    const auth = () => ({ Authorization: `Bearer ${adminToken}` });

    it('should reject unknown properties (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer() as App)
        .post('/api/v1/product')
        .set(auth())
        .send({ name: 'x', sku: 'X', unitPrice: 1, hacked: true })
        .expect(400);
    });

    it('should reject non-UUID path param', async () => {
      await request(app.getHttpServer() as App)
        .get('/api/v1/product/not-a-uuid')
        .set(auth())
        .expect(400);
    });

    it('should return 404 for non-existent resource', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer() as App)
        .get(`/api/v1/product/${fakeId}`)
        .set(auth())
        .expect(404);
    });
  });

  /* ================================================================== */

  /* ================================================================== */
  /*  14. ITEMS (direct lookup with filters)                              */
  /* ================================================================== */

  describe('Items', () => {
    const auth = () => ({ Authorization: `Bearer ${adminToken}` });
    let testItemId: string;

    it('POST /item — create', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/item')
        .set(auth())
        .send({
          name: 'E2E Item',
          sku: `E2E-ITEM-${Date.now()}`,
          unitPrice: 42.5,
          isSellable: true,
          isPurchaseable: false,
          isManufactureable: true,
        })
        .expect(201);

      expect(res.body.data.name).toBe('E2E Item');
      expect(res.body.data.isSellable).toBe(true);
      testItemId = res.body.data.id;
    });

    it('GET /item — list with pagination', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/item')
        .set(auth())
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body.data).toHaveProperty('data');
    });

    it('GET /item?isSellable=true — filter', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/item')
        .set(auth())
        .query({ isSellable: 'true' })
        .expect(200);

      expect(res.body.data.data.length).toBeGreaterThan(0);
      for (const item of res.body.data.data) {
        expect(item.isSellable).toBe(true);
      }
    });

    it('GET /item?isPurchaseable=true — filter', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/item')
        .set(auth())
        .query({ isPurchaseable: 'true' })
        .expect(200);

      for (const item of res.body.data.data) {
        expect(item.isPurchaseable).toBe(true);
      }
    });

    it('GET /item?isManufactureable=true — filter', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/item')
        .set(auth())
        .query({ isManufactureable: 'true' })
        .expect(200);

      for (const item of res.body.data.data) {
        expect(item.isManufactureable).toBe(true);
      }
    });

    it('GET /item/:id — get by id', async () => {
      const res = await request(app.getHttpServer() as App)
        .get(`/api/v1/item/${testItemId}`)
        .set(auth())
        .expect(200);

      expect(res.body.data.name).toBe('E2E Item');
    });

    it('PATCH /item/:id — update', async () => {
      const res = await request(app.getHttpServer() as App)
        .patch(`/api/v1/item/${testItemId}`)
        .set(auth())
        .send({ name: 'E2E Item Updated' })
        .expect(200);

      expect(res.body.data.name).toBe('E2E Item Updated');
    });

    it('DELETE /item/:id — delete', async () => {
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/item/${testItemId}`)
        .set(auth())
        .expect(200);
    });
  });

  /*  15. CLEANUP — remove remaining test data                           */
  /* ================================================================== */

  afterAll(async () => {
    const auth = () => ({ Authorization: `Bearer ${adminToken}` });

    if (materialId) {
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/material/${materialId}`)
        .set(auth());
    }
    if (customerId) {
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/customers/${customerId}`)
        .set(auth());
    }
    if (supplierId) {
      await request(app.getHttpServer() as App)
        .delete(`/api/v1/supplier/${supplierId}`)
        .set(auth());
    }
  });
});
