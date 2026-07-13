import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { Inventory } from '../inventory/inventory.entity';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dtos';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
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
      relations: ['region'],
    });
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['region'],
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto) {
    const warehouse = await this.findOne(id);
    Object.assign(warehouse, updateWarehouseDto);
    return this.warehouseRepository.save(warehouse);
  }

  async remove(id: string) {
    const result = await this.warehouseRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Warehouse not found');
  }

  async findInventory(warehouseId: string) {
    await this.findOne(warehouseId); // verify warehouse exists
    return this.inventoryRepository.find({
      where: { warehouseId },
      relations: ['item'],
      order: { createdAt: 'DESC' },
    });
  }
}
