import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionSimulation } from './production-simulation.entity';
import {
  CreateProductionSimulationDto,
  UpdateProductionSimulationDto,
} from './dtos';
import { ProductionSchematicService } from '../production-schematic/production-schematic.service';

@Injectable()
export class ProductionSimulationService {
  private readonly logger = new Logger(ProductionSimulationService.name);

  constructor(
    @InjectRepository(ProductionSimulation)
    private readonly simulationRepository: Repository<ProductionSimulation>,
    private readonly productionSchematicService: ProductionSchematicService,
  ) {}

  async create(
    dto: CreateProductionSimulationDto,
  ): Promise<ProductionSimulation> {
    const simulation = this.simulationRepository.create(dto);
    return this.simulationRepository.save(simulation);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: ProductionSimulation[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.simulationRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['schematic', 'warehouse'],
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<ProductionSimulation> {
    const simulation = await this.simulationRepository.findOne({
      where: { id },
      relations: ['schematic', 'warehouse'],
    });
    if (!simulation) {
      throw new NotFoundException('Production simulation not found');
    }
    return simulation;
  }

  async findByWarehouse(
    warehouseId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: ProductionSimulation[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.simulationRepository.findAndCount({
      where: { warehouseId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['schematic', 'warehouse'],
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async update(
    id: string,
    dto: UpdateProductionSimulationDto,
  ): Promise<ProductionSimulation> {
    const simulation = await this.findOne(id);
    Object.assign(simulation, dto);
    return this.simulationRepository.save(simulation);
  }

  async toggle(id: string): Promise<ProductionSimulation> {
    const simulation = await this.findOne(id);
    simulation.active = !simulation.active;
    return this.simulationRepository.save(simulation);
  }

  async remove(id: string): Promise<void> {
    const result = await this.simulationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Production simulation not found');
    }
  }

  async executeForWarehouse(warehouseId: string): Promise<void> {
    this.logger.log(
      `Executing production simulations for warehouse ${warehouseId}`,
    );

    const activeSimulations = await this.simulationRepository.find({
      where: { warehouseId, active: true },
      relations: ['schematic'],
    });

    if (activeSimulations.length === 0) {
      this.logger.log(`No active simulations for warehouse ${warehouseId}`);
      return;
    }

    for (const simulation of activeSimulations) {
      try {
        await this.productionSchematicService.produce(
          simulation.schematicId,
        );
        this.logger.log(
          `Production simulation ${simulation.id} executed successfully for schematic ${simulation.schematicId}`,
        );
      } catch (error) {
        this.logger.error(
          `Production simulation ${simulation.id} failed: ${(error as Error).message}`,
        );
      }
    }
  }
}
