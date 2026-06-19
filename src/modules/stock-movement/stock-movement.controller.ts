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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { StockMovementService } from './stock-movement.service';
import { CreateStockMovementDto, UpdateStockMovementDto } from './dtos';

@ApiTags('Stock Movement')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock-movement')
export class StockMovementController {
  constructor(
    private readonly stockMovementService: StockMovementService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Post()
  @Roles('Admin', 'Employee')
  async create(@Body() createDto: CreateStockMovementDto, @Res() res: any) {
    const stockMovement = await this.stockMovementService.create(createDto);
    return this.responsesService
      .code('created')
      .message('Stock movement created successfully')
      .sendResponse(res, stockMovement);
  }

  @Get()
  @Roles('Admin', 'Employee')
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res() res: any,
  ) {
    const result = await this.stockMovementService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
    );
    return this.responsesService
      .code('success')
      .message('Stock movements retrieved successfully')
      .sendResponse(res, result);
  }

  @Get('warehouse/:warehouseId')
  @Roles('Admin', 'Employee')
  async findByWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res() res: any,
  ) {
    const result = await this.stockMovementService.findByWarehouse(
      warehouseId,
      Number(page) || 1,
      Number(limit) || 10,
    );
    return this.responsesService
      .code('success')
      .message('Stock movements for warehouse retrieved successfully')
      .sendResponse(res, result);
  }

  @Get(':id')
  @Roles('Admin', 'Employee')
  async findById(@Param('id') id: string, @Res() res: any) {
    const stockMovement = await this.stockMovementService.findById(id);
    return this.responsesService
      .code('success')
      .message('Stock movement retrieved successfully')
      .sendResponse(res, stockMovement);
  }

  @Patch(':id')
  @Roles('Admin', 'Employee')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateStockMovementDto,
    @Res() res: any,
  ) {
    const stockMovement = await this.stockMovementService.update(id, updateDto);
    return this.responsesService
      .code('success')
      .message('Stock movement updated successfully')
      .sendResponse(res, stockMovement);
  }

  @Delete(':id')
  @Roles('Admin')
  async remove(@Param('id') id: string, @Res() res: any) {
    await this.stockMovementService.remove(id);
    return this.responsesService
      .code('success')
      .message('Stock movement deleted successfully')
      .sendResponse(res, null);
  }
}
