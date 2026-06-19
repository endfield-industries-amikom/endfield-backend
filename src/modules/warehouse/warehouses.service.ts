import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dtos';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
  ) {}

  async create(createWarehouseDto: CreateWarehouseDto) {
    const warehouse = this.warehouseRepository.create(createWarehouseDto);
    return this.warehouseRepository.save(warehouse);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.warehouseRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const warehouse = await this.warehouseRepository.findOne({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    return warehouse;
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto) {
    const warehouse = await this.findOne(id);
    Object.assign(warehouse, updateWarehouseDto);
    return this.warehouseRepository.save(warehouse);
  }

  async remove(id: string) {
    const result = await this.warehouseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Warehouse not found');
    }
  }
}
