import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Region } from './region.entity';
import { Repository } from 'typeorm';
import { CreateRegionDto, UpdateRegionDto } from './dtos';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.regionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const region = await this.regionRepository.findOne({ where: { id } });
    if (!region) {
      throw new NotFoundException('Region not found');
    }
    return region;
  }

  async create(createRegionDto: CreateRegionDto) {
    const region = this.regionRepository.create(createRegionDto);
    return this.regionRepository.save(region);
  }

  async update(id: string, updateRegionDto: UpdateRegionDto) {
    const region = await this.findOne(id);
    Object.assign(region, updateRegionDto);
    return this.regionRepository.save(region);
  }

  async remove(id: string) {
    const region = await this.findOne(id);
    await this.regionRepository.remove(region);
  }
}
