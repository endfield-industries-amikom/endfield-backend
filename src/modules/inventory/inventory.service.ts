import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './inventory.entity';
import { CreateInventoryDto, UpdateInventoryDto } from './dtos';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  async create(createDto: CreateInventoryDto): Promise<Inventory> {
    const inventory = this.inventoryRepository.create(createDto);
    return this.inventoryRepository.save(inventory);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Inventory[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.inventoryRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['warehouse', 'item'],
    });
    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['warehouse', 'item'],
    });
    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }
    return inventory;
  }

  async update(
    id: string,
    updateDto: UpdateInventoryDto,
  ): Promise<Inventory> {
    const inventory = await this.findById(id);
    Object.assign(inventory, updateDto);
    return this.inventoryRepository.save(inventory);
  }

  async remove(id: string): Promise<void> {
    const result = await this.inventoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Inventory not found');
    }
  }

  async reserve(id: string, quantity: number): Promise<Inventory> {
    const inventory = await this.findById(id);

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const available = inventory.quantityOnHand - inventory.reservedQuantity;
    if (quantity > available) {
      throw new BadRequestException(
        `Insufficient available quantity. Available: ${available}, Requested: ${quantity}`,
      );
    }

    inventory.reservedQuantity += quantity;
    inventory.quantityOnHand -= quantity;
    return this.inventoryRepository.save(inventory);
  }

  async restock(id: string, quantity: number): Promise<Inventory> {
    const inventory = await this.findById(id);

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    inventory.quantityOnHand += quantity;
    return this.inventoryRepository.save(inventory);
  }
}
