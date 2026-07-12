import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './shipment.entity';
import { CreateShipmentDto, UpdateShipmentDto } from './dtos/index';
import { ShipmentArrivedEvent } from './events/shipment-arrived.event';

@Injectable()
export class ShipmentService {
  private readonly logger = new Logger(ShipmentService.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createShipmentDto: CreateShipmentDto): Promise<Shipment> {
    const shipment = this.shipmentRepository.create(createShipmentDto);
    const saved = await this.shipmentRepository.save(shipment);

    // Start simulation in background
    this.simulateShipment(saved.id).catch((err) =>
      this.logger.error(`Shipment simulation failed for ${saved.id}`, err),
    );

    return saved;
  }

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.shipmentRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { order: { orderItems: { item: true } } },
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: { order: { orderItems: { item: true } } },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async update(id: string, dto: UpdateShipmentDto): Promise<Shipment> {
    const shipment = await this.findOne(id);
    Object.assign(shipment, dto);
    return this.shipmentRepository.save(shipment);
  }

  async remove(id: string): Promise<void> {
    const result = await this.shipmentRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Shipment not found');
  }

  private async simulateShipment(shipmentId: string): Promise<void> {
    this.logger.log(`Starting shipment simulation for ${shipmentId}`);

    await new Promise((r) => setTimeout(r, 5000));
    await this.updateStatus(shipmentId, 'SENDING');
    this.logger.log(`Shipment ${shipmentId} status: SENDING`);

    await new Promise((r) => setTimeout(r, 5000));
    await this.updateStatus(shipmentId, 'ARRIVED');
    this.logger.log(`Shipment ${shipmentId} status: ARRIVED`);

    // Fire event — handler processes inventory creation in transaction
    this.eventEmitter.emit('shipment.arrived', new ShipmentArrivedEvent(shipmentId));
  }

  private async updateStatus(id: string, status: string): Promise<void> {
    await this.shipmentRepository.update(id, { status });
  }
}
