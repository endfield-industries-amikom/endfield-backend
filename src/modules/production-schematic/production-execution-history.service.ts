import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionExecutionHistory } from './production-execution-history.entity';

@Injectable()
export class ProductionExecutionHistoryService {
  constructor(
    @InjectRepository(ProductionExecutionHistory)
    private readonly historyRepository: Repository<ProductionExecutionHistory>,
  ) {}

  async create(entry: { schematicId: string; warehouseId: string }): Promise<ProductionExecutionHistory> {
    const record = this.historyRepository.create({
      schematicId: entry.schematicId,
      warehouseId: entry.warehouseId,
      startedAt: new Date(),
      status: 'RUNNING',
    });
    return this.historyRepository.save(record);
  }

  async markCompleted(id: string): Promise<void> {
    await this.historyRepository.update(id, {
      status: 'COMPLETED',
      finishedAt: new Date(),
    });
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.historyRepository.update(id, {
      status: 'FAILED',
      finishedAt: new Date(),
      error,
    });
  }

  async findBySchematic(schematicId: string, limit: number = 20): Promise<ProductionExecutionHistory[]> {
    return this.historyRepository.find({
      where: { schematicId },
      relations: ['warehouse'],
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }

  async findByWarehouse(warehouseId: string, limit: number = 20): Promise<ProductionExecutionHistory[]> {
    return this.historyRepository.find({
      where: { warehouseId },
      relations: ['schematic'],
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }
}
