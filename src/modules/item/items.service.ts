import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Item } from '../../common/entities/item.entity';
import { CreateItemDto, UpdateItemDto } from '../../common/entities/item.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      isSellable?: boolean;
      isPurchaseable?: boolean;
      isManufactureable?: boolean;
    },
  ) {
    const where: FindOptionsWhere<Item> = {};
    if (filters?.isSellable !== undefined) where.isSellable = filters.isSellable;
    if (filters?.isPurchaseable !== undefined) where.isPurchaseable = filters.isPurchaseable;
    if (filters?.isManufactureable !== undefined) where.isManufactureable = filters.isManufactureable;

    const [data, total] = await this.itemRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async create(dto: CreateItemDto) {
    const item = this.itemRepository.create(dto);
    return this.itemRepository.save(item);
  }

  async update(id: string, dto: UpdateItemDto) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.itemRepository.save(item);
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    await this.itemRepository.remove(item);
  }
}
