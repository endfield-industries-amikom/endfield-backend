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
import { SupplierService } from './supplier.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dtos/index';

@ApiTags('Suppliers')
@Controller('supplier')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('bearer')
export class SupplierController {
  constructor(
    private readonly supplierService: SupplierService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Post()
  @Roles('Admin')
  async create(
    @Body()
    createSupplierDto: CreateSupplierDto,
    @Res() res: any,
  ) {
    const supplier = await this.supplierService.create(createSupplierDto);
    return this.responsesService
      .code('created')
      .message('Supplier created successfully')
      .sendResponse(res, supplier);
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
    const result = await this.supplierService.findAll(page, limit);
    return this.responsesService
      .code('success')
      .message('Suppliers retrieved successfully')
      .sendResponse(res, result);
  }

  @Get(':id')
  @Roles('Admin', 'Employee')
  async findOne(@Param('id') id: string, @Res() res: any) {
    const supplier = await this.supplierService.findOne(id);
    return this.responsesService
      .code('success')
      .message('Supplier retrieved successfully')
      .sendResponse(res, supplier);
  }

  @Patch(':id')
  @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @Res() res: any,
  ) {
    const supplier = await this.supplierService.update(id, updateSupplierDto);
    return this.responsesService
      .code('success')
      .message('Supplier updated successfully')
      .sendResponse(res, supplier);
  }

  @Delete(':id')
  @Roles('Admin')
  async remove(@Param('id') id: string, @Res() res: any) {
    await this.supplierService.remove(id);
    return this.responsesService
      .code('success')
      .message('Supplier deleted successfully')
      .sendResponse(res, null);
  }
}
