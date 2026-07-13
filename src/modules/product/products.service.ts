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
    const { type, ...itemFields } = dto;
    const item = this.itemRepository.create(itemFields);
    const savedItem = await this.itemRepository.save(item);

    const product = this.productRepository.create({
      id: savedItem.id,
      type,
    });
    await this.productRepository.save(product);

    return this.productRepository.findOneOrFail({
      where: { id: savedItem.id },
      relations: ['item'],
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    const { type, ...itemFields } = dto;
    if (Object.keys(itemFields).length > 0) {
      await this.itemRepository.update(product.id, itemFields);
    }
    if (type !== undefined) {
      product.type = type;
      await this.productRepository.save(product);
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    const itemId = product.id;
    await this.productRepository.remove(product);
    await this.itemRepository.delete(itemId);
  }

  async getTopSelling(limit: number = 10) {
    return this.itemRepository.find({
      order: { soldQty: 'DESC' },
      where: { isSellable: true },
      take: limit,
    });
  }
}
