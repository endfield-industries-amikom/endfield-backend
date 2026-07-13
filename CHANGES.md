# CHANGES.md — Backend API Changes

> For the frontend agent. All changes relative to the previous API shape.

---

## 1. `capacityUsage` moved to Item (shared by Product and Material)

**Before:**
- `Product` entity had `capacityUsage` (decimal, default 1)
- `Material` entity had `unit` (string, e.g. "kg")

**After:**
- `Item` entity has `capacityUsage` (decimal(5,2), default 1) — shared by all items
- `Product` entity only has `type` (string, default "product")
- `Material` entity has **no** Material-specific columns anymore (only `id` + `itemId` FK)

### API impact

**`GET /item`, `GET /item/:id`** — Response now includes `capacityUsage`:
```json
{
  "id": "uuid",
  "name": "string",
  "sku": "string",
  "capacityUsage": "1.00",
  "...": "..."
}
```

**`GET /product`, `GET /product/:id`** — `capacityUsage` removed from product level, now on nested `item`:
```json
{
  "id": "uuid",
  "itemId": "uuid",
  "type": "product",
  "item": {
    "id": "uuid",
    "name": "string",
    "capacityUsage": "1.00",
    "...": "..."
  }
}
```

**`GET /material`, `GET /material/:id`** — `unit` removed, no material-specific fields:
```json
{
  "id": "uuid",
  "itemId": "uuid",
  "item": {
    "id": "uuid",
    "name": "string",
    "capacityUsage": "1.00",
    "...": "..."
  }
}
```

**`POST /product`** — `capacityUsage` is now a top-level field (part of Item), not nested:
```json
{
  "name": "...",
  "sku": "...",
  "unitPrice": 99.99,
  "capacityUsage": 1.5,
  "type": "product"
}
```

**`POST /material`** — No more `unit` field. Just Item fields:
```json
{
  "name": "...",
  "sku": "...",
  "unitPrice": 25.50,
  "capacityUsage": 0.5
}
```

---

## 2. Warehouse `currentLoad` uses weighted capacity

**Before:** `currentLoad` incremented by raw `quantity` (each unit = 1 capacity).

**After:** `currentLoad` incremented by `quantity × item.capacityUsage` (respects per-item storage weight).

**No API impact** — this is internal calculation. But warehouse capacity bar will fill differently for items with `capacityUsage > 1`.

---

## 3. Order has `warehouse` relation

**Before:** Order response included `warehouseId` as a plain string.

**After:** Order response includes nested `warehouse` object in PO/SO/Shipment responses:
```json
{
  "order": {
    "id": "uuid",
    "warehouseId": "uuid",
    "warehouse": {
      "id": "uuid",
      "name": "Main Warehouse",
      "code": "WH-001",
      "address": "...",
      "maxCapacity": 10000,
      "currentLoad": 250,
      "...": "..."
    },
    "status": "PENDING",
    "totalAmount": "3000.00",
    "orderItems": [...]
  }
}
```

This applies to:
- `GET /purchase-order`, `GET /purchase-order/:id`
- `GET /sales-order`, `GET /sales-order/:id`
- `GET /shipment`, `GET /shipment/:id`

---

## 4. `?status` query filter on order endpoints

New optional query param on list endpoints:

| Endpoint | Param | Values |
|----------|-------|--------|
| `GET /purchase-order` | `?status=` | `PENDING`, `APPROVED` |
| `GET /sales-order` | `?status=` | `PENDING`, `SHIPPED` |

Example: `GET /api/v1/purchase-order?status=PENDING&page=1&limit=10`

---

## 5. `Warehouse.currentLoad` field

The `Warehouse` type already has `currentLoad?: number`. This is now the correct field (was previously accessed via `_count` or `as any.currentCapacity`).

The `GET /warehouses/:id` response includes `currentLoad` directly.

---

## 6. `GET /warehouses/:id/inventory` endpoint

Returns `Inventory[]` with nested `item` relation. Use this to populate warehouse detail inventory tables.

```json
[
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
      "capacityUsage": "1.00",
      "...": "..."
    }
  }
]
```

---

## 7. Production Simulation is backend-only

**Before:** `PRODUCTION_SIMULATION` table with `schematicId`, `warehouseId`, `active`. Separate CRUD controller.

**After:**
- `PRODUCTION_SIMULATION` table and all CRUD endpoints **removed**.
- `ProductionSchematic` now has `active` (boolean, default false) and `warehouseIds` (UUID array).
- Schematics auto-execute when a PURCHASE shipment arrives (via `shipment.arrived` event), filtered by matching warehouse.
- Each execution logged in `ProductionExecutionHistory` with RUNNING/COMPLETED/FAILED status.

### New endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /production-schematic/:id/history` | Execution history for a schematic |
| `GET /production-schematic/warehouse/:warehouseId/history` | Execution history for a warehouse |

### ProductionSchematic response now includes

```json
{
  "active": false,
  "warehouseIds": ["uuid", "uuid"]
}
```

### ProductionExecutionHistory response

```json
{
  "id": "uuid",
  "schematicId": "uuid",
  "warehouseId": "uuid",
  "startedAt": "ISO date",
  "finishedAt": "ISO date",
  "status": "COMPLETED",
  "error": null,
  "createdAt": "ISO date",
  "warehouse": { "id": "uuid", "name": "...", "code": "..." }
}
```
