import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './shipment.entity';
import { CreateShipmentDto, UpdateShipmentDto } from './dtos/index';
import { Inventory } from '../inventory/inventory.entity';
import { SalesOrder } from '../sales-order/sales-order.entity';
import { PurchaseOrder } from '../purchase-order/purchase-order.entity';
import { ProductionSimulationService } from '../production-simulation/production-simulation.service';
import { OrderItem } from '../order-item/order-item.entity';
import { Item } from '../../common/entities/item.entity';

@Injectable()
export class ShipmentService {
  private readonly logger = new Logger(ShipmentService.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    private readonly productionSimulationService: ProductionSimulationService,
  ) {}

  async create(createShipmentDto: CreateShipmentDto): Promise<Shipment> {
    const shipment = this.shipmentRepository.create(createShipmentDto);
    const saved = await this.shipmentRepository.save(shipment);
    this.simulateShipment(saved.id).catch((err) =>
      this.logger.error(`Shipment simulation failed for ${saved.id}`, err),
    );
    return saved;
  }

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.shipmentRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async update(id: string, dto: UpdateShipmentDto): Promise<Shipment> {
    const shipment = await this.findOne(id);
    Object.assign(shipment, dto);
    return this.shipmentRepository.save(shipment);
  }

  async remove(id: string): Promise<void> {
    const result = await this.shipmentRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Shipment not found');
  }

  private async simulateShipment(shipmentId: string): Promise<void> {
    this.logger.log(`Starting shipment simulation for ${shipmentId}`);
    await new Promise((r) => setTimeout(r, 5000));
    await this.updateStatus(shipmentId, 'SENDING');
    this.logger.log(`Shipment ${shipmentId} status: SENDING`);
    await new Promise((r) => setTimeout(r, 5000));
    await this.updateStatus(shipmentId, 'ARRIVED');
    this.logger.log(`Shipment ${shipmentId} status: ARRIVED`);

    const shipment = await this.findOne(shipmentId);
    if (shipment.orderType === 'PURCHASE') {
      await this.handlePurchaseArrival(shipment);
    } else if (shipment.orderType === 'SALES') {
      await this.handleSalesArrival(shipment);
    }
  }

  private async handlePurchaseArrival(shipment: Shipment): Promise<void> {
    const po = await this.purchaseOrderRepository.findOne({
      where: { id: shipment.orderId },
    });
    if (!po) return;
    const inventories = await this.inventoryRepository.find({
      where: { warehouseId: po.warehouseId },
    });
    for (const inv of inventories) {
      inv.quantityOnHand += 10;
      await this.inventoryRepository.save(inv);
      this.logger.log(`Restocked inventory ${inv.id} with +10 units`);
    }
    await this.productionSimulationService.executeForWarehouse(po.warehouseId);
  }

  private async handleSalesArrival(shipment: Shipment): Promise<void> {
    const salesOrder = await this.salesOrderRepository.findOne({
      where: { id: shipment.orderId },
    });
    if (!salesOrder || salesOrder.status === 'SHIPPED') return;
    salesOrder.status = 'SHIPPED';
    await this.salesOrderRepository.save(salesOrder);
    this.logger.log(`Sales order ${shipment.orderId} marked as SHIPPED`);

    const orderItems = await this.orderItemRepository.find({
      where: { orderType: 'SALES', orderId: shipment.orderId },
    });
    for (const oi of orderItems) {
      if (oi.itemId) {
        await this.itemRepository.increment({ id: oi.itemId }, 'soldQty', oi.quantity);
        this.logger.log(`Incremented soldQty for item ${oi.itemId} by ${oi.quantity}`);
      }
    }
  }

  private async updateStatus(id: string, status: string): Promise<void> {
    await this.shipmentRepository.update(id, { status });
  }
}
