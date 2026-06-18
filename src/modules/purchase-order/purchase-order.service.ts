import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dtos/index';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
  ) {}

  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    const po = this.poRepository.create(createPurchaseOrderDto);
    return this.poRepository.save(po);
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
