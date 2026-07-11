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
import { ShipmentService } from './shipment.service';
import { CreateShipmentDto, UpdateShipmentDto } from './dtos/index';

@ApiTags('Shipments')
@Controller('shipment')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('bearer')
export class ShipmentController {
  constructor(
    private readonly shipmentService: ShipmentService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Post()
  @Roles('Admin')
  async create(@Body() createShipmentDto: CreateShipmentDto, @Res() res: any) {
    const shipment = await this.shipmentService.create(createShipmentDto);
    return this.responsesService
      .code('created')
      .message('Shipment created successfully')
      .sendResponse(res, shipment);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Roles('Admin', 'Employee', 'Consumer')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Res() res: any,
  ) {
    const result = await this.shipmentService.findAll(page, limit);
    return this.responsesService
      .code('success')
      .message('Shipments retrieved successfully')
      .sendResponse(res, result);
  }

  @Get(':id')
  @Roles('Admin', 'Employee', 'Consumer')
  async findOne(@Param('id') id: string, @Res() res: any) {
    const shipment = await this.shipmentService.findOne(id);
    return this.responsesService
      .code('success')
      .message('Shipment retrieved successfully')
      .sendResponse(res, shipment);
  }

  @Patch(':id')
  @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateShipmentDto: UpdateShipmentDto,
    @Res() res: any,
  ) {
    const shipment = await this.shipmentService.update(id, updateShipmentDto);
    return this.responsesService
      .code('success')
      .message('Shipment updated successfully')
      .sendResponse(res, shipment);
  }

  @Delete(':id')
  @Roles('Admin')
  async remove(@Param('id') id: string, @Res() res: any) {
    await this.shipmentService.remove(id);
    return this.responsesService
      .code('success')
      .message('Shipment deleted successfully')
      .sendResponse(res, null);
  }
}
