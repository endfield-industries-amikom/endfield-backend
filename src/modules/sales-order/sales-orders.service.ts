import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { Order } from '../../common/entities/order.entity';
import { OrderItem } from '../order-item/order-item.entity';
import { Item } from '../../common/entities/item.entity';
import { Customer } from '../customer/customer.entity';
import { CreateSalesOrderDto, UpdateSalesOrderDto } from './dtos';

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateSalesOrderDto, userEmail: string): Promise<SalesOrder> {
    const { items, regionId, ...orderFields } = dto;

    // Look up customer by authenticated user's email
    const customer = await this.customerRepository.findOne({ where: { email: userEmail } });
    if (!customer) throw new NotFoundException('Customer record not found for your account');

    return this.dataSource.transaction(async (manager) => {
      const totalAmount = this.calculateTotalAmount(items ?? []);
      const order = manager.create(Order, { ...orderFields, totalAmount });
      const savedOrder = await manager.save(order);

      const so = manager.create(SalesOrder, {
        orderId: savedOrder.id,
        customerId: customer.id,
        regionId,
      });
      await manager.save(so);

      if (items && items.length > 0) {
        const orderItems = items.map((item) =>
          manager.create(OrderItem, {
            ...item,
            orderType: 'SALES',
            orderId: savedOrder.id,
            lineTotal: item.quantity * item.unitPrice,
          }),
        );
        await manager.save(orderItems);
      }

      return manager.findOneOrFail(SalesOrder, {
        where: { orderId: savedOrder.id },
        relations: { order: { orderItems: { item: true } }, customer: true, region: true },
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
    const [data, total] = await this.salesOrderRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { order: { createdAt: 'DESC' } },
      relations: { order: { orderItems: { item: true } }, customer: true, region: true },
    });
    return { data, total, page, limit };
  }

  async findOne(orderId: string) {
    const so = await this.salesOrderRepository.findOne({
      where: { orderId },
      relations: { order: { orderItems: { item: true } }, customer: true, region: true },
    });
    if (!so) throw new NotFoundException('Sales order not found');
    return so;
  }

  async update(orderId: string, dto: UpdateSalesOrderDto) {
    const so = await this.findOne(orderId);
    const { customerId, regionId, ...orderFields } = dto as any;
    if (Object.keys(orderFields).length > 0) {
      await this.orderRepository.update(so.orderId, orderFields);
    }
    const updates: any = {};
    if (customerId !== undefined) updates.customerId = customerId;
    if (regionId !== undefined) updates.regionId = regionId;
    if (Object.keys(updates).length > 0) {
      Object.assign(so, updates);
      await this.salesOrderRepository.save(so);
    }
    return this.findOne(orderId);
  }

  async ship(orderId: string) {
    const so = await this.findOne(orderId);
    if (so.order.status === 'SHIPPED') return so;
    await this.orderRepository.update(so.orderId, { status: 'SHIPPED' });

    const orderItems = await this.orderItemRepository.find({
      where: { orderId, orderType: 'SALES' },
    });
    for (const oi of orderItems) {
      await this.itemRepository.increment({ id: oi.itemId }, 'soldQty', oi.quantity);
    }
    return this.findOne(orderId);
  }

  async remove(orderId: string) {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(OrderItem, { orderId });
      await manager.delete(SalesOrder, { orderId });
      await manager.delete(Order, { id: orderId });
    });
  }
}
