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
import { RegionsService } from './regions.service';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { CreateRegionDto, UpdateRegionDto } from './dtos';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Region')
@Controller('region')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('bearer')
export class RegionsController {
  constructor(
    private readonly regionsService: RegionsService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Get()
  @Roles('Admin', 'Employee')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Res() res: any,
  ) {
    const data = await this.regionsService.findAll(page, limit);
    return this.responsesService
      .code('success')
      .message('Regions retrieved successfully')
      .sendResponse(res, data);
  }

  @Get(':id')
  @Roles('Admin', 'Employee')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    const data = await this.regionsService.findOne(id);
    return this.responsesService
      .code('success')
      .message('Region retrieved successfully')
      .sendResponse(res, data);
  }

  @Post()
  @Roles('Admin')
  async create(@Body() createRegionDto: CreateRegionDto, @Res() res: any) {
    const data = await this.regionsService.create(createRegionDto);
    return this.responsesService
      .code('created')
      .message('Region created successfully')
      .sendResponse(res, data);
  }

  @Patch(':id')
  @Roles('Admin')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRegionDto: UpdateRegionDto,
    @Res() res: any,
  ) {
    const data = await this.regionsService.update(id, updateRegionDto);
    return this.responsesService
      .code('success')
      .message('Region updated successfully')
      .sendResponse(res, data);
  }

  @Delete(':id')
  @Roles('Admin')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    await this.regionsService.remove(id);
    return this.responsesService
      .code('success')
      .message('Region deleted successfully')
      .sendResponse(res, null);
  }
}
