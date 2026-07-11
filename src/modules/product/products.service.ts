import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Item } from '../../common/entities/item.entity';
import { CreateProductDto, UpdateProductDto } from './dtos';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
      relations: ['item'],
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['item'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    const { type, capacityUsage, ...itemFields } = dto;
    const item = this.itemRepository.create(itemFields);
    const savedItem = await this.itemRepository.save(item);
    const product = this.productRepository.create({
      itemId: savedItem.id,
      type,
      capacityUsage,
    });
    return this.productRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    const { type, capacityUsage, ...itemFields } = dto;
    if (Object.keys(itemFields).length > 0) {
      await this.itemRepository.update(product.itemId, itemFields);
    }
    if (type !== undefined || capacityUsage !== undefined) {
      Object.assign(product, { type, capacityUsage });
      await this.productRepository.save(product);
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
    await this.itemRepository.delete(product.itemId);
  }

  async getTopSelling(limit: number = 10) {
    const items = await this.itemRepository.find({
      order: { soldQty: 'DESC' },
      take: limit,
    });
    return items;
  }
}
