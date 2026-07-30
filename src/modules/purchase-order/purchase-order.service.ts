import {
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { Order } from '../../common/entities/order.entity';
import { OrderItem } from '../order-item/order-item.entity';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dtos/index';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const { items, supplierId, warehouseId, ...orderFields } = dto;

    return this.dataSource.transaction(async (manager) => {
      const totalAmount = this.calculateTotalAmount(items ?? []);
      const order = manager.create(Order, { ...orderFields, totalAmount });
      const savedOrder = await manager.save(order);

      const po = manager.create(PurchaseOrder, {
        orderId: savedOrder.id,
        supplierId,
        warehouseId,
      });

      await manager.save(po);

      if (items && items.length > 0) {
        const orderItems = items.map((item) =>
          manager.create(OrderItem, {
            ...item,
            orderType: 'PURCHASE',
            orderId: savedOrder.id,
            lineTotal: item.quantity * item.unitPrice,
          }),
        );
        await manager.save(orderItems);
      }

      return manager.findOneOrFail(PurchaseOrder, {
        where: { orderId: savedOrder.id },
        relations: {
          order: { orderItems: { item: true } },
          supplier: true,
          warehouse: true,
        },
      });
    });
  }

  private calculateTotalAmount(
    items: { quantity: number; unitPrice: number }[],
  ): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  async findAll(page: number = 1, limit: number = 10, status?: string) {
    const where: any = {};
    if (status) {
      where.order = { status };
    }
    const [data, total] = await this.poRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { order: { createdAt: 'DESC' } },
      relations: {
        order: { orderItems: { item: true } },
        supplier: true,
        warehouse: true
      },
    });
    return { data, total, page, limit };
  }

  async findOne(orderId: string): Promise<PurchaseOrder> {
    const po = await this.poRepository.findOne({
      where: { orderId },
      relations: {
        order: { orderItems: { item: true } },
        supplier: true,
        warehouse: true
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async update(
    orderId: string,
    dto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id: orderId } });
      if (!order) throw new NotFoundException('Purchase order not found');
      const { warehouseId, items, supplierId, ...orderFields } = dto;
      const totalAmount = this.calculateTotalAmount(items ?? []);
      if (Object.keys(orderFields).length > 0) {
        await manager.update(
          Order,
          { id: orderId },
          { ...orderFields, totalAmount }
        );
      }
      await manager.update(
        PurchaseOrder,
        { orderId },
        { supplierId, warehouseId },
      );
      if (items && items.length > 0) {
        await Promise.all(
          items.map(
            async (item) =>
              await manager.update(
                OrderItem,
                { orderId },
                { ...item, lineTotal: item.quantity * item.unitPrice },
              ),
          ),
        );
      }
      return manager.findOneOrFail(PurchaseOrder, { where: { orderId } });
    });
  }

  async remove(orderId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(OrderItem, { orderId });
      await manager.delete(PurchaseOrder, { orderId });
      await manager.delete(Order, { id: orderId });
    });
  }

  async approve(orderId: string): Promise<PurchaseOrder> {
    const po = await this.findOne(orderId);

    // Check warehouse capacity before approving
    const warehouse = po.warehouse;
    const orderItems = po.order?.orderItems ?? [];

    if (warehouse && orderItems.length > 0) {
      // Calculate total capacity load: sum(quantity × item.capacityUsage)
      const totalLoad = orderItems.reduce((sum, oi) => {
        const usage = Number(oi.item?.capacityUsage ?? 1);
        return sum + oi.quantity * usage;
      }, 0);

      const currentLoad = Number(warehouse.currentLoad ?? 0);
      const maxCapacity = Number(warehouse.maxCapacity ?? 0);

      if (maxCapacity > 0 && currentLoad + totalLoad > maxCapacity) {
        throw new BadRequestException(
          `Cannot approve: warehouse capacity exceeded. ` +
            `Current: ${currentLoad}, Required: ${totalLoad}, Max: ${maxCapacity}`,
        );
      }
    }

    await this.orderRepository.update(po.orderId, { status: 'APPROVED' });
    return this.findOne(orderId);
  }
}
