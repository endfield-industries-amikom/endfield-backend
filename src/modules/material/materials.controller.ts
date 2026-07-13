import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { CreateMaterialDto, UpdateMaterialDto } from './dtos';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Material')
@Controller('material')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('bearer')
export class MaterialsController {
  constructor(
    private readonly materialsService: MaterialsService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Get()
  @Roles('Admin', 'Employee', 'Consumer')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10, @Res() res: any) {
    const data = await this.materialsService.findAll(page, limit);
    return this.responsesService.code('success').message('Materials retrieved successfully').sendResponse(res, data);
  }

  @Get(':id')
  @Roles('Admin', 'Employee', 'Consumer')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    const data = await this.materialsService.findOne(id);
    return this.responsesService.code('success').message('Material retrieved successfully').sendResponse(res, data);
  }

  @Post()
  @Roles('Admin', 'Employee')
  async create(@Body() dto: CreateMaterialDto, @Res() res: any) {
    const data = await this.materialsService.create(dto);
    return this.responsesService.code('created').message('Material created successfully').sendResponse(res, data);
  }

  @Patch(':id')
  @Roles('Admin', 'Employee')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMaterialDto, @Res() res: any) {
    const data = await this.materialsService.update(id, dto);
    return this.responsesService.code('success').message('Material updated successfully').sendResponse(res, data);
  }

  @Delete(':id')
  @Roles('Admin', 'Employee')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    await this.materialsService.remove(id);
    return this.responsesService.code('success').message('Material deleted successfully').sendResponse(res, null);
  }
}
