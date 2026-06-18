import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './shipment.entity';
import { CreateShipmentDto, UpdateShipmentDto } from './dtos/index';

@Injectable()
export class ShipmentService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
  ) {}

  async create(createShipmentDto: CreateShipmentDto): Promise<Shipment> {
    const shipment = this.shipmentRepository.create(createShipmentDto);
    return this.shipmentRepository.save(shipment);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Shipment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.shipmentRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['purchaseOrder'],
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: ['purchaseOrder'],
    });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    return shipment;
  }

  async update(
    id: string,
    updateShipmentDto: UpdateShipmentDto,
  ): Promise<Shipment> {
    const shipment = await this.findOne(id);
    Object.assign(shipment, updateShipmentDto);
    return this.shipmentRepository.save(shipment);
  }

  async remove(id: string): Promise<void> {
    const result = await this.shipmentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Shipment not found');
    }
  }
}
