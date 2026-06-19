import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from './stock-movement.entity';
import { CreateStockMovementDto, UpdateStockMovementDto } from './dtos';

@Injectable()
export class StockMovementService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
  ) {}

  async create(createDto: CreateStockMovementDto): Promise<StockMovement> {
    const stockMovement = this.stockMovementRepository.create(createDto);
    return this.stockMovementRepository.save(stockMovement);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: StockMovement[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.stockMovementRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findById(id: string): Promise<StockMovement> {
    const stockMovement = await this.stockMovementRepository.findOne({
      where: { id },
    });
    if (!stockMovement) {
      throw new NotFoundException('Stock movement not found');
    }
    return stockMovement;
  }

  async findByWarehouse(
    warehouseId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: StockMovement[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.stockMovementRepository.findAndCount({
      where: { warehouseId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async update(
    id: string,
    updateDto: UpdateStockMovementDto,
  ): Promise<StockMovement> {
    const stockMovement = await this.findById(id);
    Object.assign(stockMovement, updateDto);
    return this.stockMovementRepository.save(stockMovement);
  }

  async remove(id: string): Promise<void> {
    const result = await this.stockMovementRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Stock movement not found');
    }
  }
}
