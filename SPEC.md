# Endfield Backend — SPEC

## Overview

NestJS + Fastify monolith serving REST API for inventory & order management.
Hybrid JWT + session auth. PostgreSQL via TypeORM. Docker Compose deployment.
Global prefix: `/api/v1`.

---

## Directory Structure

```
src/
├── @types/fastify-session.d.ts    # Session type augmentation
├── admin/                          # Admin user management
├── auth/                           # Auth module (register/login/refresh/logout/profile)
├── common/                         # Decorators, filters, guards, middleware
├── config/                         # ORM configs + env loader
├── database/seed.ts                # DB seeder (roles + admin user)
├── modules/                        # 15 feature modules
│   ├── customer/                   # Customer entity + CRUD + self-service
│   ├── forecast/                   # Demand forecasts
│   ├── inventory/                  # Stock levels per warehouse/product
│   ├── order-item/                 # Shared line items (PO + SO)
│   ├── product/                    # Products / raw materials
│   ├── production-schematic/       # Recipe: inputs → output product
│   ├── production-simulation/      # Schematic × Warehouse link + auto-execution
│   ├── purchase-order/             # Procurement orders
│   ├── region/                     # Geographic regions
│   ├── sales-order/                # Customer orders
│   ├── shipment/                   # Delivery tracking + auto-simulation
│   ├── stock-movement/             # Audit log of inventory changes
│   ├── supplier/                   # Vendor directory
│   ├── upload/                     # Product image upload/serve
│   └── warehouse/                  # Storage locations
├── roles/                          # Role entity (Admin/Employee/Consumer)
├── users/                          # User entity + service
├── utils/
│   ├── encryption/                 # Argon2 + AES-256-CBC (@Global)
│   └── responses/                  # Standardized { statusCode, message, data } (@Global)
├── app.module.ts                   # Root module
└── main.ts                         # Bootstrap + plugins
```

---

## Auth Flow

### Hybrid: JWT (API) + Fastify Session (refresh token)

| Endpoint | Auth | Input | Flow |
|----------|------|-------|------|
| `POST /auth/register` | None | `{ username, email, password }` | Creates User (role=Consumer) + auto-creates Customer record, returns JWT |
| `POST /auth/login` | None | `{ email, password }` | Verifies credentials, creates session (refreshToken uuid, 7d expiry), returns JWT + Set-Cookie: sessionId |
| `POST /auth/refresh` | Session cookie | — | Validates session, returns fresh JWT |
| `POST /auth/logout` | Session cookie | — | Destroys session, 204 |
| `GET /auth/profile` | JWT | — | Returns current user info |
| `DELETE /auth/delete` | JWT | — | Deletes own account |

JWT payload: `{ sub: userId, username, email, role }`. Expiry: `JWT_EXPIRES_IN` env var (default 1h).

---

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full CRUD on all entities, user management |
| **Employee** | Most CRUD (no delete on some), view-only on admin functions |
| **Consumer** | Self-registration, view products, create/view own sales orders, view shipments |

---

## Entities

### User (`USER`)
`user_id` UUID PK, `username` UNIQUE, `email` UNIQUE, `password_hash`, `role_id` FK→ROLE, `region_id`, `full_name`, `last_login`, timestamps

### Customer (`CUSTOMER`)
`customer_id` UUID PK, `name`, `code` UNIQUE, `email`, `phone`, `address`, timestamps

### Product (`PRODUCT`)
`product_id` UUID PK, `name`, `sku` UNIQUE, `description`, `category`, `type` (default: 'product'), `capacity_usage` (default: 1), `image_uri`, `sold_qty` (default: 0), `unit_price` decimal(10,2), timestamps

### OrderItem (`ORDER_ITEM`)
`id` UUID PK, `order_type` ('PURCHASE'|'SALES'), `order_id`, `product_id` FK→PRODUCT, `quantity`, `unit_price`, `line_total`, timestamps

### Warehouse (`WAREHOUSE`)
`warehouse_id` UUID PK, `name`, `code` UNIQUE, `address`, `region_id` FK→REGION, `max_capacity` (default: 10000), timestamps

### Region (`REGION`)
`region_id` UUID PK, `name` UNIQUE, `code` UNIQUE, `description`, timestamps

### Inventory (`INVENTORY`)
`inventory_id` UUID PK, `warehouse_id`, `product_id`, `quantity_on_hand`, `reserved_quantity`, `reorder_level`, timestamps

### PurchaseOrder (`PURCHASE_ORDER`)
`po_id` UUID PK, `supplier_id` FK→SUPPLIER, `warehouse_id`, `order_date`, `status` (default: PENDING), `total_amount`, `notes`, timestamps

### SalesOrder (`SALES_ORDER`)
`order_id` UUID PK, `customer_id` FK→CUSTOMER, `warehouse_id` FK→WAREHOUSE, `order_date`, `status` (default: PENDING), `total_amount`, `notes`, timestamps

### Shipment (`SHIPMENT`)
`id` UUID PK, `po_id` FK→PURCHASE_ORDER, `sales_order_id` FK→SALES_ORDER (nullable), `carrier`, `tracking_number`, `shipped_date`, `delivery_date`, `status` (default: PENDING), `notes`, timestamps

### ProductionSchematic (`PRODUCTION_SCHEMATIC`)
`production_schematic_id` UUID PK, `name`, `type`, `inputs` JSON (string[]), `inputQty` JSON (number[]), `duration` int, `output_qty` int, `output_product_id` FK→PRODUCT, timestamps

### ProductionSimulation (`PRODUCTION_SIMULATION`)
`production_simulation_id` UUID PK, `schematic_id` FK, `warehouse_id` FK, `active` boolean, timestamps

### Supplier (`SUPPLIER`)
`id` UUID PK, `name`, `code` UNIQUE, `contact_person`, `email`, `phone`, `address`, timestamps

### Other: Forecast, StockMovement, Role

---

## Shipment Simulation

On `POST /shipment` (Admin), `ShipmentService.create()` fires background simulation:

```
PENDING ──5s──> SENDING ──5s──> ARRIVED
                                    │
                          restocks warehouse inventory (+10/record)
                          marks linked SalesOrder as SHIPPED
                          increments product.soldQty
                          executes ProductionSimulations for that warehouse
```

---

## Image Upload

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /product/:id/image` | Admin, Employee | Multipart upload. Saves to `/uploads/products/{id}.{ext}`, sets `product.imageUri`, deletes old file |
| `GET /image/:id` | None (public) | Streams image file with proper Content-Type. 404 if none |

---

## Seed Data

| Entity | Values |
|--------|--------|
| Roles | Admin, Employee, Consumer |
| Default Admin | username: `endmin`, email: `endmin@endfield.com`, password: `endminStrongPassword` |

---

## Global Middleware / Plugins

| Plugin | Config |
|--------|--------|
| `@fastify/cookie` | httpOnly, secure in prod, sameSite=strict |
| `@fastify/session` | 7-day maxAge |
| `@fastify/multipart` | File upload support |
| `@fastify/helmet` | CSP configured |
| `ValidationPipe` | whitelist + forbidNonWhitelisted + transform |
| `HttpExceptionFilter` | Structured JSON errors |
| CORS | Dev: `*`, Prod: `endfield.cydlab.my.id` + `localhost:3000` |
| Throttler | 100 req/60s global |
| Swagger | Dev only at `/api/docs` |

---

## Environment Variables

| Variable | Default | Notes |
|----------|---------|-------|
| `NODE_ENV` | development | |
| `PORT` | 3001 | |
| `DB_HOST` | localhost | |
| `DB_PORT` | 5432 | |
| `DB_USER` | postgres | |
| `DB_PASSWORD` | secret | |
| `DB_NAME` | inventory_db | |
| `JWT_SECRET` | — | Required |
| `JWT_EXPIRES_IN` | 1h | |
| `COOKIE_SECRET` | — | |
| `SESSION_SECRET` | — | |
