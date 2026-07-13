import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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
import { Public } from 'src/common/decorators/public.decorator';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto } from '../../common/entities/item.dto';

@ApiTags('Item')
@Controller('item')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('bearer')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Get()
  @Roles('Admin', 'Employee', 'Consumer')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isSellable', required: false, type: Boolean })
  @ApiQuery({ name: 'isPurchaseable', required: false, type: Boolean })
  @ApiQuery({ name: 'isManufactureable', required: false, type: Boolean })
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('isSellable') isSellable?: string,
    @Query('isPurchaseable') isPurchaseable?: string,
    @Query('isManufactureable') isManufactureable?: string,
    @Res() res?: any,
  ) {
    const filters: any = {};
    if (isSellable !== undefined) filters.isSellable = isSellable === 'true';
    if (isPurchaseable !== undefined) filters.isPurchaseable = isPurchaseable === 'true';
    if (isManufactureable !== undefined) filters.isManufactureable = isManufactureable === 'true';

    const data = await this.itemsService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
      Object.keys(filters).length > 0 ? filters : undefined,
    );
    return this.responsesService
      .code('success')
      .message('Items retrieved successfully')
      .sendResponse(res, data);
  }

  @Get(':id')
  @Roles('Admin', 'Employee', 'Consumer')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    const data = await this.itemsService.findOne(id);
    return this.responsesService
      .code('success')
      .message('Item retrieved successfully')
      .sendResponse(res, data);
  }

  @Post()
  @Roles('Admin', 'Employee')
  async create(@Body() dto: CreateItemDto, @Res() res: any) {
    const data = await this.itemsService.create(dto);
    return this.responsesService
      .code('created')
      .message('Item created successfully')
      .sendResponse(res, data);
  }

  @Patch(':id')
  @Roles('Admin', 'Employee')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateItemDto,
    @Res() res: any,
  ) {
    const data = await this.itemsService.update(id, dto);
    return this.responsesService
      .code('success')
      .message('Item updated successfully')
      .sendResponse(res, data);
  }

  @Delete(':id')
  @Roles('Admin', 'Employee')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    await this.itemsService.remove(id);
    return this.responsesService
      .code('success')
      .message('Item deleted successfully')
      .sendResponse(res, null);
  }
}
