import { Injectable, NotFoundException } from '@nestjs/common';
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
    const { items, supplierId, ...orderFields } = dto;

    return this.dataSource.transaction(async (manager) => {
      const totalAmount = this.calculateTotalAmount(items ?? []);
      const order = manager.create(Order, { ...orderFields, totalAmount });
      const savedOrder = await manager.save(order);

      const po = manager.create(PurchaseOrder, {
        orderId: savedOrder.id,
        supplierId,
      });
      const savedPo = await manager.save(po);

      if (items && items.length > 0) {
        const orderItems = items.map((item) =>
          manager.create(OrderItem, {
            ...item,
            orderType: 'PURCHASE',
            orderId: savedOrder.id,
          }),
        );
        await manager.save(orderItems);
      }

      return manager.findOneOrFail(PurchaseOrder, {
        where: { orderId: savedOrder.id },
        relations: ['order', 'supplier'],
      });
    });
  }

  private calculateTotalAmount(
    items: { quantity: number; unitPrice: number }[],
  ): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.poRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { order: { createdAt: 'DESC' } },
      relations: ['order', 'supplier'],
    });
    return { data, total, page, limit };
  }

  async findOne(orderId: string): Promise<PurchaseOrder> {
    const po = await this.poRepository.findOne({
      where: { orderId },
      relations: ['order', 'supplier'],
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async update(
    orderId: string,
    dto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    const po = await this.findOne(orderId);
    const { supplierId, ...orderFields } = dto as any;
    if (Object.keys(orderFields).length > 0) {
      await this.orderRepository.update(po.orderId, orderFields);
    }
    if (supplierId !== undefined) {
      po.supplierId = supplierId;
      await this.poRepository.save(po);
    }
    return this.findOne(orderId);
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
    await this.orderRepository.update(po.orderId, { status: 'APPROVED' });
    return this.findOne(orderId);
  }
}
