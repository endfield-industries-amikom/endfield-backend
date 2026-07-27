import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { Order } from '../../common/entities/order.entity';
import { OrderItem } from '../order-item/order-item.entity';
import { Item } from '../../common/entities/item.entity';
import { Customer } from '../customer/customer.entity';
import { Inventory } from '../inventory/inventory.entity';
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
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
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
    const { items, regionId, ...orderFields } = dto;
    return this.dataSource.transaction(async (manager) => {
      const totalAmount = items ? this.calculateTotalAmount(items) : so.order.totalAmount;
      await manager.update(Order,
        { id: orderId },
        { ...orderFields, totalAmount },
      )
      await manager.update(SalesOrder, { orderId }, {
        regionId
      })
      if (items && items.length > 0) {
        items.map(async (item) => {
          await manager.update(OrderItem, { orderId }, item)
        })
      }

      return manager.findOneOrFail(SalesOrder, {
        where: { orderId },
        relations: { order: { orderItems: { item: true } }, customer: true, region: true }
      })

    })
  }

  async confirm(orderId: string) {
    const so = await this.findOne(orderId);
    if (so.order.status !== 'PENDING') {
      throw new BadRequestException('Order can only be confirmed from PENDING status');
    }
    await this.orderRepository.update(so.orderId, { status: 'CONFIRMED' });
    return this.findOne(orderId);
  }

  async ship(orderId: string) {
    const so = await this.findOne(orderId);
    if (so.order.status !== 'CONFIRMED') {
      throw new BadRequestException('Order must be CONFIRMED before shipping');
    }

    // Check inventory availability before shipping
    const orderItems = await this.orderItemRepository.find({
      where: { orderId, orderType: 'SALES' },
    });

    for (const oi of orderItems) {
      const inventories = await this.inventoryRepository.find({
        where: { itemId: oi.itemId },
      });
      const totalAvailable = inventories.reduce(
        (sum, inv) => sum + inv.quantityOnHand,
        0,
      );
      if (totalAvailable < oi.quantity) {
        throw new BadRequestException(
          `Inventory item does not suffice: item ${oi.itemId} requires ${oi.quantity}, available ${totalAvailable}`,
        );
      }
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Order, { id: orderId }, { status: 'SHIPPED' })
      orderItems.map(async (item) => {
        const inventories = await manager.find(Inventory, {
          where: { itemId: item.itemId },
          order: {quantityOnHand: 'DESC'}
        })

        if (inventories.length === 0) {
          throw new BadRequestException(`No inventory found for item ${item.itemId}`);
        }

        let remainder = item.quantity;
        for (const inv of inventories) {
          if (remainder <= 0) break;
          const deduct = Math.min(inv.quantityOnHand, remainder);
          await manager.decrement(Inventory, { id: inv.id }, 'quantityOnHand', deduct);
          remainder -= deduct;
        }
      })
    })
    return this.findOne(orderId)
  }

  async remove(orderId: string) {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(OrderItem, { orderId });
      await manager.delete(SalesOrder, { orderId });
      await manager.delete(Order, { id: orderId });
    });
  }
}
