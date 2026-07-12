# CHANGES.3.md — Backend API Changes (Round 3)

> For the frontend agent. Changes since CHANGES.2.md (round 2).

---

## 1. Warehouse moved from Order to PurchaseOrder

**Before:** `Order` entity had `warehouseId` + `warehouse` relation shared by both PO and SO.

**After:**
- `Order` entity **no longer has** `warehouseId` or `warehouse` — warehouse is purchase-order only.
- `PurchaseOrder` now owns `warehouseId` + `warehouse` directly.

### Response change

**`GET /purchase-order`** — `warehouse` now at PO level (not nested under `order`):
```json
{
  "orderId": "uuid",
  "supplierId": "uuid",
  "warehouseId": "uuid",
  "warehouse": { "id": "uuid", "name": "...", "code": "...", "maxCapacity": 10000, "currentLoad": 250 },
  "supplier": { "...": "..." },
  "order": {
    "id": "uuid",
    "orderDate": "...",
    "status": "PENDING",
    "totalAmount": "3000.00",
    "orderItems": [...]
  }
}
```

**`GET /shipment`** — `order.warehouse` no longer present. Warehouse info accessible via `GET /warehouses/:id`.

---

## 2. SalesOrder uses `regionId` instead of `warehouseId`

**Before:** `POST /sales-order` required `warehouseId` and `customerId`.

**After:** `POST /sales-order` requires `regionId` only. `customerId` is auto-filled.

### Request change

```json
{
  "regionId": "uuid (required)",
  "orderDate": "ISO date?",
  "notes": "string?",
  "items": [
    { "itemId": "uuid", "quantity": 5, "unitPrice": 60.00 }
  ]
}
```

### Response includes `region`:
```json
{
  "orderId": "uuid",
  "customerId": "uuid",
  "regionId": "uuid",
  "customer": { "...": "..." },
  "region": { "id": "uuid", "name": "string", "code": "string" },
  "order": { "...": "..." }
}
```

---

## 3. SalesOrder `customerId` auto-filled from authenticated user

When a Consumer creates a sales order, the backend looks up their `Customer` record by email (from JWT) and sets `customerId` automatically. No need to send `customerId` in the request.

---

## 4. Region endpoints accessible to Consumer

`GET /region` and `GET /region/:id` now accept Consumer role (previously Admin, Employee only).

---

## 5. Order status FAILED on shipment failure

When `shipment.arrived` processing fails (capacity exceeded, missing PO/warehouse, transaction error):
- Shipment status → `FAILED` with `statusMessage`
- Order status → `FAILED` (previously stayed `ARRIVED`)

---

## 6. PO approval validates warehouse capacity

`POST /purchase-order/:id/approve` checks `warehouse.currentLoad + sum(quantity × item.capacityUsage) <= warehouse.maxCapacity`. Returns **400** if exceeded.

---

## 7. `produce()` auto-creates output inventory

`POST /production-schematic/:id/produce` now accepts optional `{ warehouseId }` body. If no inventory record exists for the output item in the target warehouse, it's auto-created.

---

## 8. `capacityUsage` on Item, `unit` removed from Material

- `Item` has `capacityUsage` (decimal, default 1)
- `Product` only has `type`
- `Material` has no extra columns (empty entity)
- Warehouse load calculated as `quantity × capacityUsage` per item
