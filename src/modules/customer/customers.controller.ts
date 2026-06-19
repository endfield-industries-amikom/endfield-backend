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
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dtos';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('bearer')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Post()
  @Roles('Admin')
  async create(@Body() createCustomerDto: CreateCustomerDto, @Res() res: any) {
    const customer = await this.customersService.create(createCustomerDto);
    return this.responsesService
      .code('created')
      .message('Customer created successfully')
      .sendResponse(res, customer);
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
    const result = await this.customersService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
    );
    return this.responsesService
      .code('success')
      .message('Customers retrieved successfully')
      .sendResponse(res, result);
  }

  @Get(':id')
  @Roles('Admin', 'Employee', 'Consumer')
  async findOne(@Param('id') id: string, @Res() res: any) {
    const customer = await this.customersService.findOne(id);
    return this.responsesService
      .code('success')
      .message('Customer retrieved successfully')
      .sendResponse(res, customer);
  }

  @Patch(':id')
  @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Res() res: any,
  ) {
    const customer = await this.customersService.update(id, updateCustomerDto);
    return this.responsesService
      .code('success')
      .message('Customer updated successfully')
      .sendResponse(res, customer);
  }

  @Delete(':id')
  @Roles('Admin')
  async remove(@Param('id') id: string, @Res() res: any) {
    await this.customersService.remove(id);
    return this.responsesService
      .code('success')
      .message('Customer deleted successfully')
      .sendResponse(res, null);
  }
}
