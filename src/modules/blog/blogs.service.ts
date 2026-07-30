import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './blog.entity';
import { CreateBlogDto, UpdateBlogDto } from './dtos';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.blogRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const blog = await this.blogRepository.findOne({ where: { id } });
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  async create(dto: CreateBlogDto) {
    const blog = this.blogRepository.create(dto);
    return this.blogRepository.save(blog);
  }

  async update(id: string, dto: UpdateBlogDto) {
    const blog = await this.findOne(id);
    Object.assign(blog, dto);
    return this.blogRepository.save(blog);
  }

  async remove(id: string) {
    const blog = await this.findOne(id);
    return this.blogRepository.remove(blog);
  }
}
