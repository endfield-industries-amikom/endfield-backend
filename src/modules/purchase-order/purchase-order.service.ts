import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dtos/index';
import { OrderItemService } from '../order-item/order-item.service';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    private readonly orderItemService: OrderItemService,
  ) {}

  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    const { items, ...poData } = createPurchaseOrderDto;

    const totalAmount = this.calculateTotalAmount(items ?? []);
    const po = this.poRepository.create({ ...poData, totalAmount });
    const savedPo = await this.poRepository.save(po);

    if (items && items.length > 0) {
      const orderItems = items.map((item) => ({
        ...item,
        orderType: 'PURCHASE',
        orderId: savedPo.id,
      }));
      await this.orderItemService.createMany(orderItems);
    }

    return savedPo;
  }

  private calculateTotalAmount(
    items: { quantity: number; unitPrice: number }[],
  ): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: PurchaseOrder[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.poRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['supplier'],
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const po = await this.poRepository.findOne({
      where: { id },
      relations: ['supplier'],
    });
    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }
    return po;
  }

  async update(
    id: string,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    const po = await this.findOne(id);
    Object.assign(po, updatePurchaseOrderDto);
    return this.poRepository.save(po);
  }

  async remove(id: string): Promise<void> {
    const result = await this.poRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Purchase order not found');
    }
  }

  async approve(id: string): Promise<PurchaseOrder> {
    const po = await this.findOne(id);
    po.status = 'APPROVED';
    return this.poRepository.save(po);
  }
}
