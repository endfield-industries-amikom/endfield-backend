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
import { ProductsService } from './products.service';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { CreateProductDto, UpdateProductDto } from './dtos';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Product')
@Controller('product')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('bearer')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Get()
  @Roles('Admin', 'Employee', 'Consumer')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Res() res: any,
  ) {
    const data = await this.productsService.findAll(page, limit);
    return this.responsesService
      .code('success')
      .message('Products retrieved successfully')
      .sendResponse(res, data);
  }


  @Get('top-selling')
  @Public()
  async getTopSelling(@Res() res: any) {
    const data = await this.productsService.getTopSelling();
    return this.responsesService
      .code('success')
      .message('Top selling products retrieved successfully')
      .sendResponse(res, data);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    const data = await this.productsService.findOne(id);
    return this.responsesService
      .code('success')
      .message('Product retrieved successfully')
      .sendResponse(res, data);
  }

  @Post()
  @Roles('Admin', 'Employee')
  async create(@Body() createProductDto: CreateProductDto, @Res() res: any) {
    const data = await this.productsService.create(createProductDto);
    return this.responsesService
      .code('created')
      .message('Product created successfully')
      .sendResponse(res, data);
  }

  @Patch(':id')
  @Roles('Admin', 'Employee')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Res() res: any,
  ) {
    const data = await this.productsService.update(id, updateProductDto);
    return this.responsesService
      .code('success')
      .message('Product updated successfully')
      .sendResponse(res, data);
  }

  @Delete(':id')
  @Roles('Admin', 'Employee')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    await this.productsService.remove(id);
    return this.responsesService
      .code('success')
      .message('Product deleted successfully')
      .sendResponse(res, null);
  }
}
