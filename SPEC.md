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
│   ├── decorators/
│   │   ├── public.decorator.ts     # @Public() — bypasses JwtAuthGuard
│   │   └── roles.decorator.ts      # @Roles('Admin', ...) — role requirement
│   ├── entities/
│   │   ├── item.entity.ts          # Item entity (central stockable item table)
│   │   ├── item.dto.ts             # CreateItemDto / UpdateItemDto
│   │   └── order.entity.ts         # Abstract Order base (PurchaseOrder / SalesOrder)
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       # JWT guard — skips when @Public() is set
│   │   └── roles.guard.ts          # Role guard — skips when @Public() is set
│   └── middlewares/
│       └── session.middleware.ts
├── config/                         # ORM configs + env loader
├── database/seed.ts                # DB seeder (roles + admin user)
├── modules/                        # Feature modules
│   ├── customer/                   # Customer entity + CRUD + self-service
│   ├── forecast/                   # Demand forecasts
│   ├── inventory/                  # Stock levels per warehouse/item
│   ├── item/                       # Item direct lookup (filterable: isSellable etc.)
│   ├── material/                   # Raw material entity (1:1 extension of Item)
│   ├── order-item/                 # Shared line items (PO + SO)
│   ├── product/                    # Product entity (1:1 extension of Item)
│   ├── production-schematic/       # Recipe: input items → output item
│   ├── production-simulation/      # Schematic × Warehouse link + auto-execution
│   ├── purchase-order/             # Procurement orders (extends Order)
│   ├── region/                     # Geographic regions
│   ├── sales-order/                # Customer orders (extends Order)
│   ├── shipment/                   # Delivery tracking + auto-simulation
│   ├── stock-movement/             # Audit log of inventory changes
│   ├── supplier/                   # Vendor directory
│   ├── upload/                     # Item image upload/serve
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

### Public routes

`@Public()` decorator on any handler / controller bypasses both `JwtAuthGuard` and `RolesGuard`.
Currently used on: `GET /product/top-selling`.

---

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full CRUD on all entities, user management |
| **Employee** | Most CRUD (no delete on some), view-only on admin functions |
| **Consumer** | Self-registration, view products/items, create/view own sales orders, view shipments |

---

## Entities

### Item (`ITEM`) — central stockable entity
`id` UUID PK, `name`, `sku` UNIQUE, `description`, `category`, `unit_price` decimal(10,2),
`is_sellable` (default false), `is_purchaseable` (default false), `is_manufactureable` (default false),
`image_uri`, `sold_qty` (default 0), `created_at`, `updated_at`

> Product and Material are thin 1:1 extensions via `item_id` FK→ITEM.

### Product (`PRODUCT`)
`product_id` UUID PK, `item_id` FK→ITEM (OneToOne), `type` (default: 'product'),
`capacity_usage` decimal(5,2) (default: 1)

> Defaults: `is_sellable = true`, `is_manufactureable = true` (set on Item via service).

### Material (`MATERIAL`)
`material_id` UUID PK, `item_id` FK→ITEM (OneToOne), `unit` (e.g. 'kg', 'pcs')

> Defaults: `is_purchaseable = true`, `is_sellable = true` (set on Item via service).

### Order (`ORDER`) — central order entity
`id` UUID PK, `warehouse_id`, `order_date` (default: CURRENT_TIMESTAMP), `status` (default: PENDING), `total_amount` decimal(12,2) (default: 0), `notes`, `created_at`, `updated_at`

> PurchaseOrder and SalesOrder are thin 1:1 extensions sharing the Order PK via `order_id`.

### PurchaseOrder (`PURCHASE_ORDER`)
`order_id` UUID PK/FK→ORDER (OneToOne), `supplier_id` FK→SUPPLIER

### SalesOrder (`SALES_ORDER`)
`order_id` UUID PK/FK→ORDER (OneToOne), `customer_id` FK→CUSTOMER

### OrderItem (`ORDER_ITEM`)
`id` UUID PK, `order_type` ('PURCHASE'|'SALES'), `order_id` FK→ORDER, `item_id` FK→ITEM, `quantity`, `unit_price`, `line_total`, `created_at`

### Warehouse (`WAREHOUSE`)
`warehouse_id` UUID PK, `name`, `code` UNIQUE, `address`, `region_id` FK→REGION, `max_capacity` (default: 10000), timestamps

### Region (`REGION`)
`region_id` UUID PK, `name` UNIQUE, `code` UNIQUE, `description`, timestamps

### Inventory (`INVENTORY`)
`inventory_id` UUID PK, `warehouse_id`, `item_id`, `quantity_on_hand`, `reserved_quantity`, `reorder_level`, timestamps

### Customer (`CUSTOMER`)
`customer_id` UUID PK, `name`, `code` UNIQUE, `email`, `phone`, `address`, timestamps

### Shipment (`SHIPMENT`)
`id` UUID PK, `order_type` ('PURCHASE'|'SALES'), `order_id`, `carrier`, `tracking_number`, `shipped_date`, `delivery_date`, `status` (default: PENDING), `notes`, timestamps

> Simplified: single `order_type` + `order_id` replaces old `po_id` + `sales_order_id` dual FK columns.

### ProductionSchematic (`PRODUCTION_SCHEMATIC`)
`production_schematic_id` UUID PK, `name`, `type`, `inputs` JSON (string[] — item IDs), `inputQty` JSON (number[]), `duration` int, `output_qty` int, `output_item_id` FK→ITEM, timestamps

### ProductionSimulation (`PRODUCTION_SIMULATION`)
`production_simulation_id` UUID PK, `schematic_id` FK, `warehouse_id` FK, `active` boolean, timestamps

### Supplier (`SUPPLIER`)
`id` UUID PK, `name`, `code` UNIQUE, `contact_person`, `email`, `phone`, `address`, timestamps

### User (`USER`)
`user_id` UUID PK, `username` UNIQUE, `email` UNIQUE, `password_hash`, `role_id` FK→ROLE, `region_id`, `full_name`, `last_login`, timestamps

### Other: Forecast, StockMovement, Role

---

## Key Endpoints

### Item (direct lookup)
| Endpoint | Auth | Notes |
|----------|------|-------|
| `GET /item` | Admin, Employee, Consumer | Query: `page`, `limit`, `isSellable`, `isPurchaseable`, `isManufactureable` (boolean strings) |
| `GET /item/:id` | Admin, Employee, Consumer | |
| `POST /item` | Admin, Employee | `{ name, sku, unitPrice, ...flags }` |
| `PATCH /item/:id` | Admin, Employee | |
| `DELETE /item/:id` | Admin, Employee | |

### Product
| Endpoint | Auth | Notes |
|----------|------|-------|
| `GET /product` | Admin, Employee, Consumer | Paginated. Response includes nested `item` relation |
| `GET /product/top-selling` | Public (`@Public()`) | Returns Items ordered by `soldQty` DESC |
| `POST /product` | Admin, Employee | Accepts item fields + `type`, `capacityUsage`. Creates Item+Product atomically |
| `PATCH /product/:id` | Admin, Employee | Updates Item fields via `itemId` |
| `DELETE /product/:id` | Admin, Employee | Removes Product + cascades to Item |

### Material
| Endpoint | Auth | Notes |
|----------|------|-------|
| `GET /material` | Admin, Employee, Consumer | Paginated. Response includes nested `item` relation |
| `POST /material` | Admin, Employee | Accepts item fields + `unit`. Creates Item+Material atomically |
| `PATCH /material/:id` | Admin, Employee | Updates Item fields via `itemId` |
| `DELETE /material/:id` | Admin, Employee | Removes Material + cascades to Item |

---

## Shipment Simulation

On `POST /shipment` (Admin), `ShipmentService.create()` fires background simulation.
Branches on `orderType`:

```
PENDING ──5s──> SENDING ──5s──> ARRIVED
                                    │
                    if PURCHASE: restocks warehouse inventory (+10/record)
                                 triggers production simulations
                    if SALES:    marks SalesOrder as SHIPPED
                                 increments item.soldQty per OrderItem
```

---

## Image Upload

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /product/:id/image` | Admin, Employee | Multipart upload. Saves to `UPLOAD_DIR` / `{id}.{ext}`, sets `item.imageUri`, deletes old file |
| `GET /image/:id` | None (public) | Streams image file with proper Content-Type. 404 if none |

Image path configurable via `UPLOAD_DIR` env var (default: `./images`).

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
| `JwtAuthGuard` | Applied per-controller. Skips when `@Public()` decorator present |
| `RolesGuard` | Applied per-controller. Skips when `@Public()` decorator present |
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
| `UPLOAD_DIR` | `./images` | Image upload directory |
