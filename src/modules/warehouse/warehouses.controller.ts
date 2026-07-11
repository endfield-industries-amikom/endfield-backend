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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dtos';

@ApiTags('Warehouses')
@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('bearer')
export class WarehousesController {
  constructor(
    private readonly warehousesService: WarehousesService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Post()
  @Roles('Admin')
  async create(
    @Body() createWarehouseDto: CreateWarehouseDto,
    @Res() res: any,
  ) {
    const warehouse = await this.warehousesService.create(createWarehouseDto);
    return this.responsesService
      .code('created')
      .message('Warehouse created successfully')
      .sendResponse(res, warehouse);
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
    const result = await this.warehousesService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
    );
    return this.responsesService
      .code('success')
      .message('Warehouses retrieved successfully')
      .sendResponse(res, result);
  }

  @Get(':id')
  @Roles('Admin', 'Employee')
  async findOne(@Param('id') id: string, @Res() res: any) {
    const warehouse = await this.warehousesService.findOne(id);
    return this.responsesService
      .code('success')
      .message('Warehouse retrieved successfully')
      .sendResponse(res, warehouse);
  }

  @Patch(':id')
  @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
    @Res() res: any,
  ) {
    const warehouse = await this.warehousesService.update(
      id,
      updateWarehouseDto,
    );
    return this.responsesService
      .code('success')
      .message('Warehouse updated successfully')
      .sendResponse(res, warehouse);
  }

  @Delete(':id')
  @Roles('Admin')
  async remove(@Param('id') id: string, @Res() res: any) {
    await this.warehousesService.remove(id);
    return this.responsesService
      .code('success')
      .message('Warehouse deleted successfully')
      .sendResponse(res, null);
  }
}
