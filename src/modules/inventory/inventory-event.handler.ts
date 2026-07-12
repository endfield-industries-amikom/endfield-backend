import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource, Repository } from 'typeorm';
import { Shipment } from '../shipment/shipment.entity';
import { ShipmentArrivedEvent } from '../shipment/events/shipment-arrived.event';
import { PurchaseOrder } from '../purchase-order/purchase-order.entity';
import { SalesOrder } from '../sales-order/sales-order.entity';
import { Inventory } from './inventory.entity';
import { OrderItem } from '../order-item/order-item.entity';
import { Item } from '../../common/entities/item.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { ProductionSimulationService } from '../production-simulation/production-simulation.service';

@Injectable()
export class InventoryEventHandler {
  private readonly logger = new Logger(InventoryEventHandler.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => ProductionSimulationService))
    private readonly productionSimulationService: ProductionSimulationService,
  ) {}

  @OnEvent('shipment.arrived')
  async handleShipmentArrived(event: ShipmentArrivedEvent): Promise<void> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: event.shipmentId },
    });
    if (!shipment) {
      this.logger.warn(`Shipment ${event.shipmentId} not found`);
      return;
    }

    if (shipment.orderType === 'PURCHASE') {
      await this.handlePurchaseArrival(shipment);
    } else if (shipment.orderType === 'SALES') {
      await this.handleSalesArrival(shipment);
    }
  }

  private async handlePurchaseArrival(shipment: Shipment): Promise<void> {
    const orderId = shipment.orderId;

    try {
      await this.dataSource.transaction(async (manager) => {
        const po = await manager.findOne(PurchaseOrder, {
          where: { orderId },
          relations: ['order'],
        });
        if (!po) {
          await this.failShipment(manager, shipment.id, 'Purchase order not found');
          return;
        }

        const warehouse = await manager.findOne(Warehouse, {
          where: { id: po.order.warehouseId },
        });
        if (!warehouse) {
          await this.failShipment(manager, shipment.id, 'Destination warehouse not found');
          return;
        }

        const orderItems = await manager.find(OrderItem, {
          where: { orderType: 'PURCHASE', orderId },
        });

        if (orderItems.length === 0) {
          this.logger.log(`No order items for PO ${orderId} — nothing to stock`);
          return;
        }

        const totalNewQuantity = orderItems.reduce(
          (sum, oi) => sum + oi.quantity,
          0,
        );

        // Check capacity
        if (warehouse.currentLoad + totalNewQuantity > warehouse.maxCapacity) {
          const msg =
            `Warehouse capacity exceeded. ` +
            `Current: ${warehouse.currentLoad}, Incoming: ${totalNewQuantity}, ` +
            `Max: ${warehouse.maxCapacity}`;
          await this.failShipment(manager, shipment.id, msg);
          this.logger.warn(msg);
          return;
        }

        // Add each item to inventory
        for (const oi of orderItems) {
          let inventory = await manager.findOne(Inventory, {
            where: { warehouseId: warehouse.id, itemId: oi.itemId },
          });

          if (inventory) {
            inventory.quantityOnHand += oi.quantity;
            await manager.save(inventory);
          } else {
            inventory = manager.create(Inventory, {
              warehouseId: warehouse.id,
              itemId: oi.itemId,
              quantityOnHand: oi.quantity,
              reservedQuantity: 0,
              reorderLevel: 10,
            });
            await manager.save(inventory);
          }
          this.logger.log(
            `Stocked item ${oi.itemId} x${oi.quantity} into warehouse ${warehouse.id}`,
          );
        }

        // Update warehouse load
        warehouse.currentLoad += totalNewQuantity;
        await manager.save(warehouse);

        this.logger.log(
          `Shipment ${shipment.id} processed. Warehouse ${warehouse.id} load: ${warehouse.currentLoad}/${warehouse.maxCapacity}`,
        );
      });

      // Trigger production simulations (outside transaction, fire-and-forget)
      const po = await this.purchaseOrderRepository.findOne({
        where: { orderId },
        relations: ['order'],
      });
      if (po) {
        await this.productionSimulationService.executeForWarehouse(
          po.order.warehouseId,
        );
      }
    } catch (error) {
      this.logger.error(
        `Purchase arrival failed for shipment ${shipment.id}: ${(error as Error).message}`,
      );
      await this.shipmentRepository.update(shipment.id, {
        status: 'FAILED',
        statusMessage: `Transaction error: ${(error as Error).message}`,
      });
    }
  }

  private async handleSalesArrival(shipment: Shipment): Promise<void> {
    const orderId = shipment.orderId;

    try {
      await this.dataSource.transaction(async (manager) => {
        const so = await manager.findOne(SalesOrder, {
          where: { orderId },
          relations: ['order'],
        });
        if (!so || so.order.status === 'SHIPPED') return;

        await manager.update(
          'ORDER',
          { id: orderId },
          { status: 'SHIPPED' },
        );
        this.logger.log(`Sales order ${orderId} marked as SHIPPED`);

        const orderItems = await manager.find(OrderItem, {
          where: { orderType: 'SALES', orderId },
        });
        for (const oi of orderItems) {
          if (oi.itemId) {
            await manager.increment(
              Item,
              { id: oi.itemId },
              'soldQty',
              oi.quantity,
            );
            this.logger.log(
              `Incremented soldQty for item ${oi.itemId} by ${oi.quantity}`,
            );
          }
        }
      });
    } catch (error) {
      this.logger.error(
        `Sales arrival failed for shipment ${shipment.id}: ${(error as Error).message}`,
      );
    }
  }

  private async failShipment(
    manager: any,
    shipmentId: string,
    message: string,
  ): Promise<void> {
    await manager.update(Shipment, shipmentId, {
      status: 'FAILED',
      statusMessage: message,
    });
  }
}
