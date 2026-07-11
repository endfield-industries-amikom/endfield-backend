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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto, UpdateInventoryDto } from './dtos';

@ApiTags('Inventory')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Post()
  @Roles('Admin', 'Employee')
  async create(@Body() createDto: CreateInventoryDto, @Res() res: any) {
    const inventory = await this.inventoryService.create(createDto);
    return this.responsesService
      .code('created')
      .message('Inventory created successfully')
      .sendResponse(res, inventory);
  }

  @Get()
  @Roles('Admin', 'Employee')
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res() res: any,
  ) {
    const result = await this.inventoryService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
    );
    return this.responsesService
      .code('success')
      .message('Inventories retrieved successfully')
      .sendResponse(res, result);
  }

  @Get(':id')
  @Roles('Admin', 'Employee')
  async findById(@Param('id') id: string, @Res() res: any) {
    const inventory = await this.inventoryService.findById(id);
    return this.responsesService
      .code('success')
      .message('Inventory retrieved successfully')
      .sendResponse(res, inventory);
  }

  @Patch(':id')
  @Roles('Admin', 'Employee')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInventoryDto,
    @Res() res: any,
  ) {
    const inventory = await this.inventoryService.update(id, updateDto);
    return this.responsesService
      .code('success')
      .message('Inventory updated successfully')
      .sendResponse(res, inventory);
  }

  @Delete(':id')
  @Roles('Admin')
  async remove(@Param('id') id: string, @Res() res: any) {
    await this.inventoryService.remove(id);
    return this.responsesService
      .code('success')
      .message('Inventory deleted successfully')
      .sendResponse(res, null);
  }

  @Patch(':id/reserve')
  @Roles('Admin', 'Employee')
  async reserve(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Res() res: any,
  ) {
    const inventory = await this.inventoryService.reserve(id, quantity);
    return this.responsesService
      .code('success')
      .message('Inventory reserved successfully')
      .sendResponse(res, inventory);
  }

  @Patch(':id/restock')
  @Roles('Admin', 'Employee')
  async restock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Res() res: any,
  ) {
    const inventory = await this.inventoryService.restock(id, quantity);
    return this.responsesService
      .code('success')
      .message('Inventory restocked successfully')
      .sendResponse(res, inventory);
  }
}
