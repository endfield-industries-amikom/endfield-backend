import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dtos';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.customerRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    Object.assign(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  async remove(id: string) {
    const result = await this.customerRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Customer not found');
    }
  }

  async findByEmail(email: string) {
    const customer = await this.customerRepository.findOne({
      where: { email },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async updateMe(id: string, updateCustomerDto: UpdateCustomerDto) {
    // Only allow updating non-sensitive fields
    const allowed = {
      name: updateCustomerDto.name,
      phone: updateCustomerDto.phone,
      address: updateCustomerDto.address,
    };
    const customer = await this.findOne(id);
    Object.assign(customer, allowed);
    return this.customerRepository.save(customer);
  }
}
