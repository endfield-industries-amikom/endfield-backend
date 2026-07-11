import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './material.entity';
import { Item } from '../../common/entities/item.entity';
import { CreateMaterialDto, UpdateMaterialDto } from './dtos';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.materialRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
      relations: ['item'],
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: ['item'],
    });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async create(dto: CreateMaterialDto) {
    const { unit, ...itemFields } = dto;
    const item = this.itemRepository.create(itemFields);
    const savedItem = await this.itemRepository.save(item);
    const material = this.materialRepository.create({
      itemId: savedItem.id,
      unit,
    });
    return this.materialRepository.save(material);
  }

  async update(id: string, dto: UpdateMaterialDto) {
    const material = await this.findOne(id);
    const { unit, ...itemFields } = dto;
    if (Object.keys(itemFields).length > 0) {
      await this.itemRepository.update(material.itemId, itemFields);
    }
    if (unit !== undefined) {
      material.unit = unit;
      await this.materialRepository.save(material);
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    const material = await this.findOne(id);
    await this.materialRepository.remove(material);
    await this.itemRepository.delete(material.itemId);
  }
}
