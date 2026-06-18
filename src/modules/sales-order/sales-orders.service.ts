import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { CreateSalesOrderDto, UpdateSalesOrderDto } from './dtos';

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
  ) {}

  async create(createSalesOrderDto: CreateSalesOrderDto) {
    const salesOrder = this.salesOrderRepository.create(createSalesOrderDto);
    return this.salesOrderRepository.save(salesOrder);
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
    return this.salesOrderRepository.save(salesOrder);
  }

  async remove(id: string) {
    const result = await this.salesOrderRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Sales order not found');
    }
  }
}
