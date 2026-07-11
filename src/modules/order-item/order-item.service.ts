import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { CreateOrderItemDto } from './dtos';

@Injectable()
export class OrderItemService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async create(createOrderItemDto: CreateOrderItemDto): Promise<OrderItem> {
    const lineTotal = createOrderItemDto.quantity * createOrderItemDto.unitPrice;
    const item = this.orderItemRepository.create({
      ...createOrderItemDto,
      lineTotal,
    });
    return this.orderItemRepository.save(item);
  }

  async createMany(
    dtos: CreateOrderItemDto[],
  ): Promise<OrderItem[]> {
    const items = dtos.map((dto) =>
      this.orderItemRepository.create({
        ...dto,
        lineTotal: dto.quantity * dto.unitPrice,
      }),
    );
    return this.orderItemRepository.save(items);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: OrderItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.orderItemRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['product'],
    });
    return { data, total, page, limit };
  }

  async findByOrderId(
    orderType: string,
    orderId: string,
  ): Promise<OrderItem[]> {
    return this.orderItemRepository.find({
      where: { orderType, orderId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<OrderItem> {
    const item = await this.orderItemRepository.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!item) {
      throw new NotFoundException('Order item not found');
    }
    return item;
  }

  async remove(id: string): Promise<void> {
    const result = await this.orderItemRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Order item not found');
    }
  }

  async removeByOrderId(orderType: string, orderId: string): Promise<void> {
    await this.orderItemRepository.delete({ orderType, orderId });
  }
}
