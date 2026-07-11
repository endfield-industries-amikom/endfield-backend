import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { CreateSalesOrderDto, UpdateSalesOrderDto } from './dtos';
import { OrderItemService } from '../order-item/order-item.service';
import { Product } from '../product/product.entity';

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly orderItemService: OrderItemService,
  ) {}

  async create(createSalesOrderDto: CreateSalesOrderDto) {
    const { items, ...soData } = createSalesOrderDto;

    const totalAmount = this.calculateTotalAmount(items ?? []);
    const salesOrder = this.salesOrderRepository.create({ ...soData, totalAmount });
    const savedSo = await this.salesOrderRepository.save(salesOrder);

    if (items && items.length > 0) {
      const orderItems = items.map((item) => ({
        ...item,
        orderType: 'SALES',
        orderId: savedSo.id,
      }));
      await this.orderItemService.createMany(orderItems);
    }

    return savedSo;
  }

  private calculateTotalAmount(
    items: { quantity: number; unitPrice: number }[],
  ): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.salesOrderRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['customer', 'warehouse'],
    });
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const salesOrder = await this.salesOrderRepository.findOne({
      where: { id },
      relations: ['customer', 'warehouse'],
    });
    if (!salesOrder) {
      throw new NotFoundException('Sales order not found');
    }
    return salesOrder;
  }

  async update(id: string, updateSalesOrderDto: UpdateSalesOrderDto) {
    const salesOrder = await this.findOne(id);
    Object.assign(salesOrder, updateSalesOrderDto);
    return this.salesOrderRepository.save(salesOrder);
  }

  async ship(orderId: string) {
    const salesOrder = await this.findOne(orderId);
    if (salesOrder.status === 'SHIPPED') {
      return salesOrder;
    }
    salesOrder.status = 'SHIPPED';
    const savedSo = await this.salesOrderRepository.save(salesOrder);

    // Increment soldQty on each product in the order items
    const orderItems = await this.orderItemService.findByOrderId(
      'SALES',
      orderId,
    );
    for (const item of orderItems) {
      await this.productRepository.increment(
        { id: item.productId },
        'soldQty',
        item.quantity,
      );
    }

    return savedSo;
  }

  async remove(id: string) {
    const result = await this.salesOrderRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Sales order not found');
    }
  }
}
