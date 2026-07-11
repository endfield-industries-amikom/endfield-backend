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
    createDto: CreateProductionSchematicDto,
  ): Promise<ProductionSchematic> {
    const schematic = this.schematicRepository.create(createDto);
    return this.schematicRepository.save(schematic);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: ProductionSchematic[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.schematicRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['outputProduct'],
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<ProductionSchematic> {
    const schematic = await this.schematicRepository.findOne({
      where: { id },
      relations: ['outputProduct'],
    });
    if (!schematic) {
      throw new NotFoundException('Production schematic not found');
    }
    return schematic;
  }

  async update(
    id: string,
    updateDto: UpdateProductionSchematicDto,
  ): Promise<ProductionSchematic> {
    const schematic = await this.findOne(id);
    Object.assign(schematic, updateDto);
    return this.schematicRepository.save(schematic);
  }

  async remove(id: string): Promise<void> {
    const result = await this.schematicRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Production schematic not found');
    }
  }

  async produce(id: string): Promise<ProductionSchematic> {
    const schematic = await this.schematicRepository.findOne({
      where: { id },
      relations: ['outputProduct'],
    });
    if (!schematic) {
      throw new NotFoundException('Production schematic not found');
    }

    const inputs: string[] = schematic.inputs ?? [];
    const inputQty: number[] = schematic.inputQty ?? [];

    if (inputs.length === 0) {
      throw new BadRequestException(
        'Production schematic has no input products defined',
      );
    }

    if (inputs.length !== inputQty.length) {
      throw new BadRequestException(
        'Input products and input quantities must have the same length',
      );
    }

    // Deduct input quantities from inventory
    for (let i = 0; i < inputs.length; i++) {
      const productId = inputs[i];
      const requiredQty = inputQty[i];

      const inventory = await this.inventoryRepository.findOne({
        where: { productId },
      });

      if (!inventory) {
        throw new BadRequestException(
          `No inventory found for input product ${productId}`,
        );
      }

      if (inventory.quantityOnHand < requiredQty) {
        throw new BadRequestException(
          `Insufficient inventory for product ${productId}. ` +
            `Available: ${inventory.quantityOnHand}, Required: ${requiredQty}`,
        );
      }

      inventory.quantityOnHand -= requiredQty;
      await this.inventoryRepository.save(inventory);
    }

    // Add output to inventory
    const outputInventory = await this.inventoryRepository.findOne({
      where: { productId: schematic.outputProductId },
    });

    if (!outputInventory) {
      throw new BadRequestException(
        `No inventory found for output product ${schematic.outputProductId}. ` +
          `Please create an inventory record for this product first.`,
      );
    }

    outputInventory.quantityOnHand += schematic.outputQty;
    await this.inventoryRepository.save(outputInventory);

    return schematic;
  }
}
