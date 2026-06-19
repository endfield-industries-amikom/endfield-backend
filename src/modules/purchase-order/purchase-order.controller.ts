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
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dtos/index';

@ApiTags('Purchase Orders')
@Controller('purchase-order')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('bearer')
export class PurchaseOrderController {
  constructor(
    private readonly poService: PurchaseOrderService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Post()
  @Roles('Admin', 'Employee')
  async create(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
    @Res() res: any,
  ) {
    const po = await this.poService.create(createPurchaseOrderDto);
    return this.responsesService
      .code('created')
      .message('Purchase order created successfully')
      .sendResponse(res, po);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Roles('Admin', 'Employee')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Res() res: any,
  ) {
    const result = await this.poService.findAll(page, limit);
    return this.responsesService
      .code('success')
      .message('Purchase orders retrieved successfully')
      .sendResponse(res, result);
  }

  @Get(':id')
  @Roles('Admin', 'Employee')
  async findOne(@Param('id') id: string, @Res() res: any) {
    const po = await this.poService.findOne(id);
    return this.responsesService
      .code('success')
      .message('Purchase order retrieved successfully')
      .sendResponse(res, po);
  }

  @Patch(':id')
  @Roles('Admin', 'Employee')
  async update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @Res() res: any,
  ) {
    const po = await this.poService.update(id, updatePurchaseOrderDto);
    return this.responsesService
      .code('success')
      .message('Purchase order updated successfully')
      .sendResponse(res, po);
  }

  @Delete(':id')
  @Roles('Admin')
  async remove(@Param('id') id: string, @Res() res: any) {
    await this.poService.remove(id);
    return this.responsesService
      .code('success')
      .message('Purchase order deleted successfully')
      .sendResponse(res, null);
  }

  @Post(':poId/approve')
  @Roles('Admin')
  async approve(@Param('poId') poId: string, @Res() res: any) {
    const po = await this.poService.approve(poId);
    return this.responsesService
      .code('success')
      .message('Purchase order approved successfully')
      .sendResponse(res, po);
  }
}
