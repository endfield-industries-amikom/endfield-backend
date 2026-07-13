import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionSchematic } from './production-schematic.entity';
import { Inventory } from 'src/modules/inventory/inventory.entity';
import {
  CreateProductionSchematicDto,
  UpdateProductionSchematicDto,
} from './dtos';

@Injectable()
export class ProductionSchematicService {
  constructor(
    @InjectRepository(ProductionSchematic)
    private readonly schematicRepository: Repository<ProductionSchematic>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  async create(
    dto: CreateProductionSchematicDto,
  ): Promise<ProductionSchematic> {
    const schematic = this.schematicRepository.create(dto);
    return this.schematicRepository.save(schematic);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.schematicRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['outputItem'],
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<ProductionSchematic> {
    const schematic = await this.schematicRepository.findOne({
      where: { id },
      relations: ['outputItem'],
    });
    if (!schematic) throw new NotFoundException('Production schematic not found');
    return schematic;
  }

  async update(id: string, dto: UpdateProductionSchematicDto): Promise<ProductionSchematic> {
    const schematic = await this.findOne(id);
    Object.assign(schematic, dto);
    return this.schematicRepository.save(schematic);
  }

  async remove(id: string): Promise<void> {
    const result = await this.schematicRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Production schematic not found');
  }

  async produce(id: string, warehouseId?: string): Promise<ProductionSchematic> {
    const schematic = await this.schematicRepository.findOne({
      where: { id },
      relations: ['outputItem'],
    });
    if (!schematic) throw new NotFoundException('Production schematic not found');

    const inputs: string[] = schematic.inputs ?? [];
    const inputQty: number[] = schematic.inputQty ?? [];

    if (inputs.length === 0) {
      throw new BadRequestException('Production schematic has no input items defined');
    }
    if (inputs.length !== inputQty.length) {
      throw new BadRequestException('Input items and quantities must have the same length');
    }

    // Deduct inputs from inventory (scoped to warehouse if provided)
    for (let i = 0; i < inputs.length; i++) {
      const itemId = inputs[i];
      const requiredQty = inputQty[i];

      const where: any = { itemId };
      if (warehouseId) where.warehouseId = warehouseId;

      const inventory = await this.inventoryRepository.findOne({ where });
      if (!inventory) {
        const scope = warehouseId ? ` in warehouse ${warehouseId}` : '';
        throw new BadRequestException(`No inventory found for input item ${itemId}${scope}`);
      }
      if (inventory.quantityOnHand < requiredQty) {
        throw new BadRequestException(
          `Insufficient inventory for item ${itemId}. Available: ${inventory.quantityOnHand}, Required: ${requiredQty}`,
        );
      }
      inventory.quantityOnHand -= requiredQty;
      await this.inventoryRepository.save(inventory);
    }

    // Add output to inventory — auto-create if missing
    const outWhere: any = { itemId: schematic.outputItemId };
    if (warehouseId) outWhere.warehouseId = warehouseId;

    let outputInventory = await this.inventoryRepository.findOne({ where: outWhere });

    if (outputInventory) {
      outputInventory.quantityOnHand += schematic.outputQty;
      await this.inventoryRepository.save(outputInventory);
    } else {
      // Auto-create inventory record for the output item in this warehouse
      outputInventory = this.inventoryRepository.create({
        itemId: schematic.outputItemId,
        warehouseId: warehouseId ?? undefined,
        quantityOnHand: schematic.outputQty,
        reservedQuantity: 0,
        reorderLevel: 10,
      });
      await this.inventoryRepository.save(outputInventory);
    }

    return schematic;
  }
}
