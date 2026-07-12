# Endfield Backend — API Reference

Base URL: `http://localhost:3001/api/v1`

## Response Wrapper

All endpoints (except logout and image streaming) return:

```json
{
  "statusCode": 200,
  "message": "Human-readable message",
  "data": { ... }
}
```

Status codes: `200` success, `201` created, `400` bad request, `401` unauthorized, `403` forbidden, `404` not found, `500` internal server error.

---

## 1. Authentication

### `POST /auth/register`

Register a new user (auto-assigned role: Consumer, auto-creates Customer record).

**Auth:** None

**Request:**
```json
{
  "username": "string, min 3 chars",
  "email": "valid email",
  "password": "string, min 8 chars"
}
```

**Response** `201`:
```json
{
  "statusCode": 201,
  "message": "Registration successful",
  "data": {
    "access_token": "jwt-token",
    "user": {
      "id": "uuid",
      "username": "endmin",
      "email": "endmin@endfield.com",
      "role": "Consumer"
    }
  }
}
```

---

### `POST /auth/login`

Authenticate with email/username and password. Sets session cookie.

**Auth:** None

**Request:**
```json
{
  "email": "endmin@endfield.com",
  "username": "(optional, alternative to email)",
  "password": "string, min 8 chars"
}
```

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "access_token": "jwt-token",
    "refreshToken": "session-uuid",
    "user": {
      "id": "uuid",
      "username": "endmin",
      "email": "endmin@endfield.com",
      "role": "Admin"
    }
  }
}
```
Also sets `Set-Cookie: sessionId=...` header.

---

### `POST /auth/refresh`

Get a fresh JWT using the session cookie.

**Auth:** Session cookie

**Request:** None

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "new-jwt-token",
    "user": { "id": "uuid", "username": "...", "email": "...", "role": "..." }
  }
}
```

---

### `POST /auth/logout`

Destroy the session.

**Auth:** Session cookie

**Request:** None

**Response** `204` — No Content

---

### `GET /auth/profile`

Get current authenticated user's profile.

**Auth:** `Authorization: Bearer <jwt>`

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "username": "endmin",
    "email": "endmin@endfield.com",
    "role": "Admin"
  }
}
```

---

### `PATCH /auth/profile`

**Auth:** `Authorization: Bearer <jwt>`

**Request:**
```json
{
  "username": "string?",
  "email": "string?"
}
```

**Response** `200`: `{ "statusCode": 200, "message": "Profile update endpoint", "data": null }` (stub)

---

### `DELETE /auth/delete`

Delete own account.

**Auth:** `Authorization: Bearer <jwt>`

**Request:** None

**Response** `200`: `{ "statusCode": 200, "message": "Account deleted successfully", "data": null }`

---

## 2. Items

### `GET /item`

List items with optional filter flags.

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee, Consumer)

**Query:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | number | 1 | |
| `limit` | number | 10 | |
| `isSellable` | `"true"` / `"false"` | — | |
| `isPurchaseable` | `"true"` / `"false"` | — | |
| `isManufactureable` | `"true"` / `"false"` | — | |

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Items retrieved successfully",
  "data": {
    "data": [
      {
        "id": "uuid",
        "name": "Wuling Small Battery",
        "sku": "W-E-WSE1",
        "description": "A battery capable of storing 5kWh",
        "category": "Electricity",
        "unitPrice": "1000.00",
        "isSellable": true,
        "isPurchaseable": false,
        "isManufactureable": true,
        "imageUri": null,
        "soldQty": 0,
        "createdAt": "2026-07-11T14:06:03.315Z",
        "updatedAt": "2026-07-11T14:06:03.315Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### `GET /item/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee, Consumer)

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Item retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "string",
    "sku": "string",
    "description": "string?",
    "category": "string?",
    "unitPrice": "decimal(10,2)",
    "isSellable": false,
    "isPurchaseable": false,
    "isManufactureable": false,
    "imageUri": "string?",
    "soldQty": 0,
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

---

### `POST /item`

Create a standalone item (without Product/Material extension).

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Request:**
```json
{
  "name": "string, 1-255 chars (required)",
  "sku": "string, 1-100 chars (required, unique)",
  "description": "string?",
  "category": "string?",
  "unitPrice": "decimal(10,2) (required)",
  "isSellable": false,
  "isPurchaseable": false,
  "isManufactureable": false,
  "imageUri": "string?",
  "soldQty": 0
}
```

**Response** `201`: `{ "statusCode": 201, "message": "Item created successfully", "data": { ...item } }`

---

### `PATCH /item/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Request:** Any subset of `POST /item` fields (all optional).

**Response** `200`: `{ "statusCode": 200, "message": "Item updated successfully", "data": { ...item } }`

---

### `DELETE /item/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Response** `200`: `{ "statusCode": 200, "message": "Item deleted successfully", "data": null }`

---

## 3. Products

Products are 1:1 extensions of Item. Creating a Product auto-creates the underlying Item.

### `GET /product`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee, Consumer)

**Query:** `page` (default 1), `limit` (default 10)

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": {
    "data": [
      {
        "id": "uuid (product PK)",
        "itemId": "uuid (item FK)",
        "type": "product",
        "capacityUsage": "1.50",
        "item": {
          "id": "uuid",
          "name": "string",
          "sku": "string",
          "description": "string?",
          "category": "string?",
          "unitPrice": "decimal(10,2)",
          "isSellable": true,
          "isPurchaseable": false,
          "isManufactureable": true,
          "imageUri": "string?",
          "soldQty": 0,
          "createdAt": "ISO date",
          "updatedAt": "ISO date"
        }
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### `GET /product/top-selling`

**Auth:** None (`@Public()`)

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Top selling products retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "sku": "string",
      "soldQty": 150,
      "unitPrice": "1000.00",
      "...": "..."
    }
  ]
}
```

---

### `GET /product/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee, Consumer)

**Response** `200`: `{ "statusCode": 200, "message": "Product retrieved successfully", "data": { ...product with nested item } }`

---

### `POST /product`

Create a Product and its underlying Item atomically.

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Request:** All `CreateItemDto` fields + product-specific:
```json
{
  "name": "string (required)",
  "sku": "string (required, unique)",
  "description": "string?",
  "category": "string?",
  "unitPrice": "decimal (required)",
  "isSellable": true,
  "isManufactureable": true,
  "isPurchaseable": false,
  "imageUri": "string?",
  "soldQty": 0,
  "type": "product",
  "capacityUsage": 1.00
}
```

**Response** `201`: `{ "statusCode": 201, "message": "Product created successfully", "data": { id, itemId, type, capacityUsage } }`

---

### `PATCH /product/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Request:** Any subset of create fields (all optional).

**Response** `200`: `{ ...product with nested item }`

---

### `DELETE /product/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Response** `200`: `{ "statusCode": 200, "message": "Product deleted successfully", "data": null }`

---

## 4. Materials

Materials are 1:1 extensions of Item. Creating a Material auto-creates the underlying Item.

### `GET /material`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee, Consumer)

**Query:** `page` (default 1), `limit` (default 10)

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Materials retrieved successfully",
  "data": {
    "data": [
      {
        "id": "uuid (material PK)",
        "itemId": "uuid",
        "unit": "kg",
        "item": {
          "id": "uuid",
          "name": "string",
          "sku": "string",
          "description": "string?",
          "category": "string?",
          "unitPrice": "decimal(10,2)",
          "isSellable": true,
          "isPurchaseable": true,
          "isManufactureable": false,
          "imageUri": "string?",
          "soldQty": 0,
          "createdAt": "ISO date",
          "updatedAt": "ISO date"
        }
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### `GET /material/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee, Consumer)

**Response** `200`: `{ ...material with nested item }`

---

### `POST /material`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Request:** All `CreateItemDto` fields + material-specific:
```json
{
  "name": "string (required)",
  "sku": "string (required, unique)",
  "description": "string?",
  "category": "string?",
  "unitPrice": "decimal (required)",
  "isSellable": true,
  "isPurchaseable": true,
  "isManufactureable": false,
  "imageUri": "string?",
  "soldQty": 0,
  "unit": "kg"
}
```

**Response** `201`: `{ "statusCode": 201, "message": "Material created successfully", "data": { id, itemId, unit } }`

---

### `PATCH /material/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Response** `200`: `{ ...material with nested item }`

---

### `DELETE /material/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Response** `200`: `{ "statusCode": 200, "message": "Material deleted successfully", "data": null }`

---

## 5. Purchase Orders

### `GET /purchase-order`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Query:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | number | 1 | |
| `limit` | number | 10 | |
| `status` | string | — | Filter by order status: `PENDING`, `APPROVED` |

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Purchase orders retrieved successfully",
  "data": {
    "data": [
      {
        "orderId": "uuid",
        "supplierId": "uuid",
        "supplier": {
          "id": "uuid",
          "name": "string",
          "code": "string",
          "email": "string",
          "phone": "string?",
          "address": "string?",
          "contactPerson": "string?",
          "createdAt": "ISO date",
          "updatedAt": "ISO date"
        },
        "order": {
          "id": "uuid",
          "warehouseId": "uuid",
          "orderDate": "2026-07-12",
          "status": "PENDING",
          "totalAmount": "3000.00",
          "notes": "string?",
          "createdAt": "ISO date",
          "updatedAt": "ISO date",
          "orderItems": [
            {
              "id": "uuid",
              "orderType": "PURCHASE",
              "orderId": "uuid",
              "itemId": "uuid",
              "quantity": 10,
              "unitPrice": "100.00",
              "lineTotal": "1000.00",
              "createdAt": "ISO date",
              "item": {
                "id": "uuid",
                "name": "string",
                "sku": "string",
                "unitPrice": "100.00",
                "...": "..."
              }
            }
          ]
        }
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10
  }
}
```

---

### `GET /purchase-order/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Response** `200`: `{ ...single purchase order with order.orderItems.item }`

---

### `POST /purchase-order`

Creates Order + PurchaseOrder + OrderItems in a transaction.

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Request:**
```json
{
  "supplierId": "uuid (required)",
  "warehouseId": "uuid (required)",
  "orderDate": "ISO date string?",
  "status": "PENDING",
  "totalAmount": 3000.00,
  "notes": "string?",
  "items": [
    {
      "itemId": "uuid",
      "quantity": 10,
      "unitPrice": 100.00
    }
  ]
}
```

**Response** `201`: `{ "statusCode": 201, "message": "Purchase order created successfully", "data": { ...purchase order with nested relations } }`

---

### `PATCH /purchase-order/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Request:** Any subset of create fields (all optional).

**Response** `200`: `{ ...updated purchase order }`

---

### `DELETE /purchase-order/:id`

Deletes OrderItems → PurchaseOrder → Order in a transaction.

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Response** `200`: `{ "statusCode": 200, "message": "Purchase order deleted successfully", "data": null }`

---

### `POST /purchase-order/:id/approve`

Sets the order status to `APPROVED`.

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Response** `200`: `{ "statusCode": 200, "message": "Purchase order approved successfully", "data": { ...purchase order } }`

---

### `GET /purchase-order/:id/items`

List all OrderItems for a purchase order.

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Items retrieved",
  "data": [
    {
      "id": "uuid",
      "orderType": "PURCHASE",
      "orderId": "uuid",
      "itemId": "uuid",
      "quantity": 10,
      "unitPrice": "100.00",
      "lineTotal": "1000.00",
      "createdAt": "ISO date",
      "item": { "id": "uuid", "name": "string", "sku": "string", "...": "..." }
    }
  ]
}
```

---

### `POST /purchase-order/:id/items`

Add a single OrderItem to a purchase order.

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Request:**
```json
{
  "itemId": "uuid",
  "quantity": 5,
  "unitPrice": 50.00
}
```

**Response** `201`: `{ "statusCode": 201, "message": "Item added", "data": { ...order item } }`

---

### `DELETE /purchase-order/:id/items/:itemId`

Remove a single OrderItem.

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Response** `200`: `{ "statusCode": 200, "message": "Item removed", "data": null }`

---

## 6. Sales Orders

### `GET /sales-order`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee, Consumer)

**Query:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | number | 1 | |
| `limit` | number | 10 | |
| `status` | string | — | Filter by order status: `PENDING`, `SHIPPED` |

**Response** `200`: Same structure as PurchaseOrder but with `customer` instead of `supplier`:
```json
{
  "data": {
    "data": [
      {
        "orderId": "uuid",
        "customerId": "uuid",
        "customer": { "id": "uuid", "name": "string", "code": "string", "email": "string", "...": "..." },
        "order": {
          "id": "uuid",
          "warehouseId": "uuid",
          "orderDate": "2026-07-12",
          "status": "PENDING",
          "totalAmount": "600.00",
          "notes": "string?",
          "createdAt": "ISO date",
          "updatedAt": "ISO date",
          "orderItems": [
            {
              "id": "uuid",
              "orderType": "SALES",
              "orderId": "uuid",
              "itemId": "uuid",
              "quantity": 5,
              "unitPrice": "60.00",
              "lineTotal": "300.00",
              "createdAt": "ISO date",
              "item": { "id": "uuid", "name": "string", "sku": "string", "...": "..." }
            }
          ]
        }
      }
    ],
    "total": 8,
    "page": 1,
    "limit": 10
  }
}
```

---

### `GET /sales-order/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee, Consumer)

**Response** `200`: `{ ...single sales order with order.orderItems.item }`

---

### `POST /sales-order`

Creates Order + SalesOrder + OrderItems in a transaction.

**Auth:** `Authorization: Bearer <jwt>` (Admin, Consumer)

**Request:**
```json
{
  "customerId": "uuid (required)",
  "warehouseId": "uuid (required)",
  "orderDate": "ISO date string?",
  "status": "PENDING",
  "totalAmount": 600.00,
  "notes": "string?",
  "items": [
    {
      "itemId": "uuid",
      "quantity": 5,
      "unitPrice": 60.00
    }
  ]
}
```

**Response** `201`: `{ "statusCode": 201, "message": "Sales order created successfully", "data": { ...sales order } }`

---

### `PATCH /sales-order/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Response** `200`: `{ ...updated sales order }`

---

### `DELETE /sales-order/:id`

Deletes OrderItems → SalesOrder → Order in a transaction.

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Response** `200`: `{ "statusCode": 200, "message": "Sales order deleted successfully", "data": null }`

---

### `POST /sales-order/:id/ship`

Sets order status to `SHIPPED` and increments `item.soldQty` for each OrderItem.

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Response** `200`: `{ "statusCode": 200, "message": "Sales order shipped successfully", "data": { ...sales order } }`

---

### `GET /sales-order/:id/items`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee, Consumer)

**Response** `200`: Array of OrderItems with nested `item`.

---

### `POST /sales-order/:id/items`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Consumer)

**Request:** `{ "itemId": "uuid", "quantity": 5, "unitPrice": 60.00 }`

**Response** `201`: `{ "statusCode": 201, "message": "Item added", "data": { ...order item } }`

---

### `DELETE /sales-order/:id/items/:itemId`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Consumer)

**Response** `200`: `{ "statusCode": 200, "message": "Item removed", "data": null }`

---

## 7. Shipments

### `GET /shipment`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee, Consumer)

**Query:** `page` (default 1), `limit` (default 10)

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Shipments retrieved successfully",
  "data": {
    "data": [
      {
        "id": "uuid",
        "orderType": "PURCHASE",
        "orderId": "uuid",
        "carrier": "E2E Courier",
        "trackingNumber": "E2E-TRK-123",
        "shippedDate": "2026-07-12",
        "deliveryDate": null,
        "status": "ARRIVED",
        "statusMessage": null,
        "notes": "string?",
        "createdAt": "ISO date",
        "updatedAt": "ISO date",
        "order": {
          "id": "uuid",
          "warehouseId": "uuid",
          "orderDate": "2026-07-12",
          "status": "APPROVED",
          "totalAmount": "3000.00",
          "notes": "string?",
          "createdAt": "ISO date",
          "updatedAt": "ISO date",
          "orderItems": [
            {
              "id": "uuid",
              "orderType": "PURCHASE",
              "orderId": "uuid",
              "itemId": "uuid",
              "quantity": 10,
              "unitPrice": "100.00",
              "lineTotal": "1000.00",
              "createdAt": "ISO date",
              "item": { "id": "uuid", "name": "string", "sku": "string", "...": "..." }
            }
          ]
        }
      }
    ],
    "total": 20,
    "page": 1,
    "limit": 10
  }
}
```

---

### `GET /shipment/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee, Consumer)

**Response** `200`: `{ ...single shipment with order.orderItems.item }`

---

### `POST /shipment`

Creates a shipment and starts background simulation (PENDING → SENDING → ARRIVED over 10s).

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Request:**
```json
{
  "orderType": "PURCHASE | SALES (required)",
  "orderId": "uuid (required)",
  "carrier": "string?",
  "trackingNumber": "string?",
  "shippedDate": "ISO date string?",
  "deliveryDate": "ISO date string?",
  "status": "PENDING",
  "notes": "string?"
}
```

**Response** `201`:
```json
{
  "statusCode": 201,
  "message": "Shipment created successfully",
  "data": {
    "id": "uuid",
    "orderType": "PURCHASE",
    "orderId": "uuid",
    "status": "PENDING",
    "statusMessage": null,
    "...": "..."
  }
}
```

> Background simulation auto-creates inventory on PURCHASE arrival and marks sales orders SHIPPED on SALES arrival. If warehouse capacity is exceeded, shipment status becomes `FAILED` with a `statusMessage`.

---

### `PATCH /shipment/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Response** `200`: `{ ...updated shipment }`

---

### `DELETE /shipment/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Response** `200`: `{ "statusCode": 200, "message": "Shipment deleted successfully", "data": null }`

---

## 8. Inventory

> Inventory records are **auto-created** when PURCHASE shipments arrive. Manual `POST` is disabled.

### `GET /inventory`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Query:** `page`, `limit`

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Inventories retrieved successfully",
  "data": {
    "data": [
      {
        "id": "uuid",
        "warehouseId": "uuid",
        "itemId": "uuid",
        "quantityOnHand": 100,
        "reservedQuantity": 0,
        "reorderLevel": 10,
        "createdAt": "ISO date",
        "updatedAt": "ISO date",
        "warehouse": { "id": "uuid", "name": "string", "code": "string", "...": "..." },
        "item": { "id": "uuid", "name": "string", "sku": "string", "...": "..." }
      }
    ],
    "total": 20,
    "page": 1,
    "limit": 10
  }
}
```

---

### `GET /inventory/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Response** `200`: `{ ...single inventory with warehouse + item }`

---

### `PATCH /inventory/:id`

Manual adjustment of inventory fields.

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Request:**
```json
{
  "quantityOnHand": 200,
  "reservedQuantity": 5,
  "reorderLevel": 20
}
```
All fields optional.

**Response** `200`: `{ ...updated inventory }`

---

### `DELETE /inventory/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Response** `200`: `{ "statusCode": 200, "message": "Inventory deleted successfully", "data": null }`

---

### `PATCH /inventory/:id/reserve`

Reserve a quantity from available stock.

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Request:**
```json
{ "quantity": 5 }
```

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Inventory reserved successfully",
  "data": {
    "...": "...",
    "quantityOnHand": 95,
    "reservedQuantity": 5
  }
}
```

---

### `PATCH /inventory/:id/restock`

Manually restock inventory.

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Request:**
```json
{ "quantity": 50 }
```

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Inventory restocked successfully",
  "data": { "...": "...", "quantityOnHand": 150 }
}
```

---

## 9. Warehouses

### `GET /warehouses`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Query:** `page`, `limit`

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Warehouses retrieved successfully",
  "data": {
    "data": [
      {
        "id": "uuid",
        "name": "Main Warehouse",
        "code": "WH-001",
        "address": "123 Storage Ln",
        "regionId": "uuid",
        "maxCapacity": 10000,
        "currentLoad": 250,
        "createdAt": "ISO date",
        "updatedAt": "ISO date",
        "region": { "id": "uuid", "name": "string", "code": "string", "...": "..." }
      }
    ],
    "total": 3,
    "page": 1,
    "limit": 10
  }
}
```

---

### `GET /warehouses/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Response** `200`: `{ ...single warehouse with region }`

---

### `GET /warehouses/:id/inventory`

List all inventory records in a specific warehouse.

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Warehouse inventory retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "warehouseId": "uuid",
      "itemId": "uuid",
      "quantityOnHand": 100,
      "reservedQuantity": 5,
      "reorderLevel": 10,
      "createdAt": "ISO date",
      "updatedAt": "ISO date",
      "item": {
        "id": "uuid",
        "name": "string",
        "sku": "string",
        "unitPrice": "100.00",
        "...": "..."
      }
    }
  ]
}
```

---

### `POST /warehouses`

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Request:**
```json
{
  "name": "string (required)",
  "code": "string, max 20 chars (required, unique)",
  "address": "string?",
  "regionId": "uuid?",
  "maxCapacity": 10000
}
```

**Response** `201`: `{ "statusCode": 201, "message": "Warehouse created successfully", "data": { ...warehouse } }`

---

### `PATCH /warehouses/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Response** `200`: `{ ...updated warehouse }`

---

### `DELETE /warehouses/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Response** `200`: `{ "statusCode": 200, "message": "Warehouse deleted successfully", "data": null }`

---

## 10. Regions

### `GET /region`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Query:** `page` (default 1), `limit` (default 10)

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Regions retrieved successfully",
  "data": {
    "data": [
      {
        "id": "uuid",
        "name": "North America",
        "code": "NA",
        "description": "North American region",
        "createdAt": "ISO date",
        "updatedAt": "ISO date"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

---

### `GET /region/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Response** `200`: `{ ...single region }`

---

### `POST /region`

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Request:**
```json
{
  "name": "string, 1-100 chars (required)",
  "code": "string, 1-10 chars (required, unique)",
  "description": "string?"
}
```

**Response** `201`: `{ "statusCode": 201, "message": "Region created successfully", "data": { ...region } }`

---

### `PATCH /region/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Response** `200`: `{ ...updated region }`

---

### `DELETE /region/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin)

**Response** `200`: `{ "statusCode": 200, "message": "Region deleted successfully", "data": null }`

---

## 11. Suppliers

### `GET /supplier`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Query:** `page` (default 1), `limit` (default 10)

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Suppliers retrieved successfully",
  "data": {
    "data": [
      {
        "id": "uuid",
        "name": "Supplier Inc.",
        "code": "SUP-001",
        "contactPerson": "John Doe",
        "email": "supplier@example.com",
        "phone": "555-0100",
        "address": "456 Vendor Rd",
        "createdAt": "ISO date",
        "updatedAt": "ISO date"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 10
  }
}
```

---

### `GET /supplier/:id` / `POST /supplier` / `PATCH /supplier/:id` / `DELETE /supplier/:id`

Standard CRUD. POST requires: `{ name, code (unique), contactPerson?, email?, phone?, address? }`.

---

## 12. Customers

### `GET /customers`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee, Consumer)

**Query:** `page`, `limit`

**Response** `200`:
```json
{
  "data": {
    "data": [
      {
        "id": "uuid",
        "name": "Customer Name",
        "code": "CUST-abc12345",
        "email": "customer@example.com",
        "phone": "555-0300",
        "address": "789 Buyer Ln",
        "createdAt": "ISO date",
        "updatedAt": "ISO date"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

---

### `GET /customers/me`

Get the Customer profile for the currently authenticated user (matched by email).

**Auth:** `Authorization: Bearer <jwt>` (any authenticated user)

**Response** `200`: `{ ...single customer }`

---

### `PATCH /customers/me` / `DELETE /customers/me`

Update or delete own customer profile. Auth: JWT.

---

### `GET /customers/:id` / `POST /customers` / `PATCH /customers/:id` / `DELETE /customers/:id`

Standard CRUD. POST requires: `{ name, code (unique), email?, phone?, address? }`. Admin only for POST/PATCH/DELETE by ID.

---

## 13. Production Schematics

### `GET /production-schematic`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Query:** `page`, `limit`

**Response** `200`:
```json
{
  "statusCode": 200,
  "message": "Production schematics retrieved successfully",
  "data": {
    "data": [
      {
        "id": "uuid",
        "name": "Battery Assembly",
        "type": "assembly",
        "inputs": ["uuid-of-item-1", "uuid-of-item-2"],
        "inputQty": [2, 1],
        "duration": 60,
        "outputQty": 1,
        "outputItemId": "uuid",
        "createdAt": "ISO date",
        "updatedAt": "ISO date",
        "outputItem": { "id": "uuid", "name": "string", "sku": "string", "...": "..." }
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

---

### `GET /production-schematic/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Response** `200`: `{ ...single schematic with outputItem }`

---

### `POST /production-schematic`

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Request:**
```json
{
  "name": "string (required)",
  "type": "string (required)",
  "inputs": ["uuid", "uuid"],
  "inputQty": [2, 1],
  "duration": 60,
  "outputQty": 1,
  "outputItemId": "uuid (required)"
}
```

**Response** `201`: `{ "statusCode": 201, "message": "Schematic created", "data": { ...schematic } }`

---

### `PATCH /production-schematic/:id` / `DELETE /production-schematic/:id`

Standard CRUD.

---

### `POST /production-schematic/:id/produce`

Execute the schematic: deduct input items from inventory, add output to inventory.

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Response** `200`: `{ "statusCode": 200, "message": "Production executed", "data": { ...schematic } }`

---

## 14. Image Upload

### `POST /product/:id/image`

Upload an image for an item (by item ID). Overwrites existing image.

**Auth:** `Authorization: Bearer <jwt>` (Admin, Employee)

**Request:** Multipart form data with file field.

Supported formats: JPEG, PNG, GIF, WebP, BMP.

**Response** `201`:
```json
{
  "statusCode": 201,
  "message": "Image uploaded successfully",
  "data": { "imageUri": "/api/v1/image/uuid" }
}
```

---

### `GET /image/:id`

Stream an uploaded image.

**Auth:** None (public)

**Response:** Binary image stream with proper `Content-Type` header and `Cache-Control: public, max-age=86400`.

**404** if image not found.

---

## 15. Admin

### `GET /admin/users`

**Auth:** `Authorization: Bearer <jwt>` (Admin only)

**Query:** `page`, `limit`

**Response** `200`: Paginated list of User entities.

---

### `GET /admin/users/:id`

**Auth:** `Authorization: Bearer <jwt>` (Admin only)

**Response** `200`: Single user.

---

### `POST /admin/users`

**Auth:** `Authorization: Bearer <jwt>` (Admin only)

**Request:** `{ username, email, password, roleId?, fullName? }`

**Response** `201`: Created user.

---

## Pagination Convention

All list endpoints return:

```json
{
  "data": [ ... ],
  "total": 42,
  "page": 1,
  "limit": 10
}
```

Query params: `page` (default 1), `limit` (default 10). Some endpoints also include `totalPages`.

---

## Auth Headers

| Auth Type | Header |
|-----------|--------|
| JWT | `Authorization: Bearer <token>` |
| Session | Cookie: `sessionId=<value>` (set automatically by login) |
