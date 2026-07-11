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
import { SalesOrdersService } from './sales-orders.service';
import { CreateSalesOrderDto, UpdateSalesOrderDto } from './dtos';
import { OrderItemService } from '../order-item/order-item.service';
import { CreateOrderItemDto } from '../order-item/dtos';

@ApiTags('Sales Orders')
@Controller('sales-order')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('bearer')
export class SalesOrdersController {
  constructor(
    private readonly salesOrdersService: SalesOrdersService,
    private readonly responsesService: ResponsesService<any>,
    private readonly orderItemService: OrderItemService,
  ) {}

  @Post()
  @Roles('Admin', 'Consumer')
  async create(
    @Body() createSalesOrderDto: CreateSalesOrderDto,
    @Res() res: any,
  ) {
    const salesOrder =
      await this.salesOrdersService.create(createSalesOrderDto);
    return this.responsesService
      .code('created')
      .message('Sales order created successfully')
      .sendResponse(res, salesOrder);
  }

  @Get()
  @Roles('Admin', 'Employee', 'Consumer')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res() res: any,
  ) {
    const result = await this.salesOrdersService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
    );
    return this.responsesService
      .code('success')
      .message('Sales orders retrieved successfully')
      .sendResponse(res, result);
  }

  @Get(':id')
  @Roles('Admin', 'Employee', 'Consumer')
  async findOne(@Param('id') id: string, @Res() res: any) {
    const salesOrder = await this.salesOrdersService.findOne(id);
    return this.responsesService
      .code('success')
      .message('Sales order retrieved successfully')
      .sendResponse(res, salesOrder);
  }

  @Post(':orderId/ship')
  @Roles('Admin')
  async ship(@Param('orderId') orderId: string, @Res() res: any) {
    const salesOrder = await this.salesOrdersService.ship(orderId);
    return this.responsesService
      .code('success')
      .message('Sales order shipped successfully')
      .sendResponse(res, salesOrder);
  }

  @Patch(':id')
  @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateSalesOrderDto: UpdateSalesOrderDto,
    @Res() res: any,
  ) {
    const salesOrder = await this.salesOrdersService.update(
      id,
      updateSalesOrderDto,
    );
    return this.responsesService
      .code('success')
      .message('Sales order updated successfully')
      .sendResponse(res, salesOrder);
  }

  @Delete(':id')
  @Roles('Admin')
  async remove(@Param('id') id: string, @Res() res: any) {
    await this.salesOrdersService.remove(id);
    return this.responsesService
      .code('success')
      .message('Sales order deleted successfully')
      .sendResponse(res, null);
  }

  @Post(':id/items')
  @Roles('Admin', 'Consumer')
  async addItem(
    @Param('id') id: string,
    @Body() dto: CreateOrderItemDto,
    @Res() res: any,
  ) {
    const item = await this.orderItemService.create({ ...dto, orderType: 'SALES', orderId: id });
    return this.responsesService.code('created').message('Item added').sendResponse(res, item);
  }

  @Get(':id/items')
  @Roles('Admin', 'Employee', 'Consumer')
  async getItems(@Param('id') id: string, @Res() res: any) {
    const items = await this.orderItemService.findByOrderId('SALES', id);
    return this.responsesService.code('success').message('Items retrieved').sendResponse(res, items);
  }

  @Delete(':id/items/:itemId')
  @Roles('Admin', 'Consumer')
  async removeItem(@Param('itemId') itemId: string, @Res() res: any) {
    await this.orderItemService.remove(itemId);
    return this.responsesService.code('success').message('Item removed').sendResponse(res, null);
  }
}
