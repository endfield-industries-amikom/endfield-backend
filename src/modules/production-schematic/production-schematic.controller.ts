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
import { ProductionSchematicService } from './production-schematic.service';
import {
  CreateProductionSchematicDto,
  UpdateProductionSchematicDto,
} from './dtos';

@ApiTags('Production Schematic')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production-schematic')
export class ProductionSchematicController {
  constructor(
    private readonly schematicService: ProductionSchematicService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Post()
  @Roles('Admin', 'Employee')
  async create(
    @Body() createDto: CreateProductionSchematicDto,
    @Res() res: any,
  ) {
    const schematic = await this.schematicService.create(createDto);
    return this.responsesService
      .code('created')
      .message('Production schematic created successfully')
      .sendResponse(res, schematic);
  }

  @Get()
  @Roles('Admin', 'Employee')
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res() res: any,
  ) {
    const result = await this.schematicService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
    );
    return this.responsesService
      .code('success')
      .message('Production schematics retrieved successfully')
      .sendResponse(res, result);
  }

  @Get(':id')
  @Roles('Admin', 'Employee')
  async findOne(@Param('id') id: string, @Res() res: any) {
    const schematic = await this.schematicService.findOne(id);
    return this.responsesService
      .code('success')
      .message('Production schematic retrieved successfully')
      .sendResponse(res, schematic);
  }

  @Patch(':id')
  @Roles('Admin', 'Employee')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductionSchematicDto,
    @Res() res: any,
  ) {
    const schematic = await this.schematicService.update(id, updateDto);
    return this.responsesService
      .code('success')
      .message('Production schematic updated successfully')
      .sendResponse(res, schematic);
  }

  @Delete(':id')
  @Roles('Admin')
  async remove(@Param('id') id: string, @Res() res: any) {
    await this.schematicService.remove(id);
    return this.responsesService
      .code('success')
      .message('Production schematic deleted successfully')
      .sendResponse(res, null);
  }

  @Post(':id/produce')
  @Roles('Admin', 'Employee')
  async produce(@Param('id') id: string, @Res() res: any) {
    const schematic = await this.schematicService.produce(id);
    return this.responsesService
      .code('success')
      .message('Production completed successfully')
      .sendResponse(res, schematic);
  }
}
