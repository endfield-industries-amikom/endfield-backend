import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionSchematic } from '../production-schematic/production-schematic.entity';
import { ProductionSchematicService } from '../production-schematic/production-schematic.service';
import { ProductionExecutionHistoryService } from '../production-schematic/production-execution-history.service';

@Injectable()
export class ProductionSimulationService {
  private readonly logger = new Logger(ProductionSimulationService.name);

  constructor(
    @InjectRepository(ProductionSchematic)
    private readonly schematicRepository: Repository<ProductionSchematic>,
    private readonly productionSchematicService: ProductionSchematicService,
    private readonly historyService: ProductionExecutionHistoryService,
  ) {}

  async executeForWarehouse(warehouseId: string): Promise<void> {
    this.logger.log(`Executing production schematics for warehouse ${warehouseId}`);

    const schematics = await this.schematicRepository.find({
      where: { active: true },
      order: { createdAt: 'ASC' },
    });

    const matching = schematics.filter(
      (s) => s.warehouseIds && s.warehouseIds.includes(warehouseId),
    );

    if (matching.length === 0) {
      this.logger.log(`No active schematics for warehouse ${warehouseId}`);
      return;
    }

    for (const schematic of matching) {
      const history = await this.historyService.create({
        schematicId: schematic.id,
        warehouseId,
      });

      try {
        await this.productionSchematicService.produce(schematic.id, warehouseId);
        await this.historyService.markCompleted(history.id);
        this.logger.log(
          `Schematic "${schematic.name}" (${schematic.id}) executed for warehouse ${warehouseId}`,
        );
      } catch (error) {
        const msg = (error as Error).message;
        await this.historyService.markFailed(history.id, msg);
        this.logger.error(`Schematic "${schematic.name}" failed: ${msg}`);
      }
    }
  }
}
