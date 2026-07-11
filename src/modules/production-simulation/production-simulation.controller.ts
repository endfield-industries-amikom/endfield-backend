import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { ProductionSimulationService } from './production-simulation.service';
import {
  CreateProductionSimulationDto,
  UpdateProductionSimulationDto,
} from './dtos';

@ApiTags('Production Simulation')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production-simulation')
export class ProductionSimulationController {
  constructor(
    private readonly simulationService: ProductionSimulationService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Post()
  @Roles('Admin', 'Employee')
  async create(
    @Body() dto: CreateProductionSimulationDto,
    @Res() res: any,
  ) {
    const simulation = await this.simulationService.create(dto);
    return this.responsesService
      .code('created')
      .message('Production simulation created successfully')
      .sendResponse(res, simulation);
  }

  @Get()
  @Roles('Admin', 'Employee')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res() res: any,
  ) {
    const result = await this.simulationService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
    );
    return this.responsesService
      .code('success')
      .message('Production simulations retrieved successfully')
      .sendResponse(res, result);
  }

  @Get('warehouse/:warehouseId')
  @Roles('Admin', 'Employee')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findByWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res() res: any,
  ) {
    const result = await this.simulationService.findByWarehouse(
      warehouseId,
      Number(page) || 1,
      Number(limit) || 10,
    );
    return this.responsesService
      .code('success')
      .message('Production simulations retrieved successfully')
      .sendResponse(res, result);
  }

  @Get(':id')
  @Roles('Admin', 'Employee')
  async findOne(@Param('id') id: string, @Res() res: any) {
    const simulation = await this.simulationService.findOne(id);
    return this.responsesService
      .code('success')
      .message('Production simulation retrieved successfully')
      .sendResponse(res, simulation);
  }

  @Patch(':id')
  @Roles('Admin', 'Employee')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductionSimulationDto,
    @Res() res: any,
  ) {
    const simulation = await this.simulationService.update(id, dto);
    return this.responsesService
      .code('success')
      .message('Production simulation updated successfully')
      .sendResponse(res, simulation);
  }

  @Post('toggle/:id')
  @Roles('Admin', 'Employee')
  async toggle(@Param('id') id: string, @Res() res: any) {
    const simulation = await this.simulationService.toggle(id);
    return this.responsesService
      .code('success')
      .message('Production simulation toggled successfully')
      .sendResponse(res, simulation);
  }

  @Delete(':id')
  @Roles('Admin')
  async remove(@Param('id') id: string, @Res() res: any) {
    await this.simulationService.remove(id);
    return this.responsesService
      .code('success')
      .message('Production simulation deleted successfully')
      .sendResponse(res, null);
  }
}
