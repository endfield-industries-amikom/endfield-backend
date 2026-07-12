# CHANGES.2.md — Backend API Changes (Round 2)

> For the frontend agent. Changes since CHANGES.md (round 1).

---

## 1. `capacityUsage` moved to Item, `unit` removed from Material

**Item** now has `capacityUsage` (decimal(5,2), default 1). **Product** only has `type`. **Material** has no extra columns.

`POST /product` and `POST /material` accept `capacityUsage` as a top-level field (part of Item fields). `POST /material` no longer accepts `unit`.

---

## 2. Warehouse capacity uses weighted load

`warehouse.currentLoad` incremented by `quantity × item.capacityUsage` instead of raw quantity. Capacity bar in UI fills proportionally.

---

## 3. Order has `warehouse` relation

PO/SO/Shipment responses include nested `order.warehouse` object.

---

## 4. `?status` query filter on order endpoints

`GET /purchase-order?status=PENDING|APPROVED`
`GET /sales-order?status=PENDING|SHIPPED`

---

## 5. `GET /warehouses/:id/inventory`

Returns `Inventory[]` with nested `item` relation.

---

## 6. Production Simulation is backend-only

- `PRODUCTION_SIMULATION` table and CRUD endpoints **removed**.
- `ProductionSchematic` has `active` (boolean) + `warehouseIds` (UUID array).
- Auto-executes on PURCHASE shipment arrival.
- Each execution logged in `ProductionExecutionHistory`.

### New schematic fields

```json
{ "active": false, "warehouseIds": ["uuid"] }
```

### New endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /production-schematic/:id/history` | Execution history (includes `warehouse`) |
| `GET /production-schematic/warehouse/:warehouseId/history` | Execution history (includes `schematic`) |

---

## 7. `produce()` auto-creates output inventory

`POST /production-schematic/:id/produce` now accepts optional `{ warehouseId }` body. If no inventory record exists for the output item in the target warehouse, it's auto-created.

---

## 8. PO approval validates warehouse capacity

`POST /purchase-order/:id/approve` now checks `warehouse.currentLoad + sum(quantity × capacityUsage) <= maxCapacity`. Returns **400** if exceeded.

---

## 9. Order status updated to ARRIVED on shipment arrival

When `shipment.arrived` event fires, `Order.status` set to `ARRIVED` before inventory processing.
