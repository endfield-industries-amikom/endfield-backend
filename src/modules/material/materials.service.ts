import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Material } from './material.entity';
import { Repository } from 'typeorm';
import { CreateMaterialDto, UpdateMaterialDto } from './dtos';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.materialRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async create(dto: CreateMaterialDto) {
    const material = this.materialRepository.create(dto);
    return this.materialRepository.save(material);
  }

  async update(id: string, dto: UpdateMaterialDto) {
    const material = await this.findOne(id);
    Object.assign(material, dto);
    return this.materialRepository.save(material);
  }

  async remove(id: string) {
    const material = await this.findOne(id);
    await this.materialRepository.remove(material);
  }
}
