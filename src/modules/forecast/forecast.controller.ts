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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { ForecastService } from './forecast.service';
import { CreateForecastDto, UpdateForecastDto } from './dtos';

@ApiTags('Forecast')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('forecast')
export class ForecastController {
  constructor(
    private readonly forecastService: ForecastService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Post()
  @Roles('Admin')
  async create(@Body() createDto: CreateForecastDto, @Res() res: any) {
    const forecast = await this.forecastService.create(createDto);
    return this.responsesService
      .code('created')
      .message('Forecast created successfully')
      .sendResponse(res, forecast);
  }

  @Get()
  @Roles('Admin', 'Employee')
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res() res: any,
  ) {
    const result = await this.forecastService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
    );
    return this.responsesService
      .code('success')
      .message('Forecasts retrieved successfully')
      .sendResponse(res, result);
  }

  @Get('region/:regionId')
  @Roles('Admin', 'Employee')
  async findByRegion(
    @Param('regionId') regionId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res() res: any,
  ) {
    const result = await this.forecastService.findByRegion(
      regionId,
      Number(page) || 1,
      Number(limit) || 10,
    );
    return this.responsesService
      .code('success')
      .message('Forecasts for region retrieved successfully')
      .sendResponse(res, result);
  }

  @Get(':id')
  @Roles('Admin', 'Employee')
  async findById(@Param('id') id: string, @Res() res: any) {
    const forecast = await this.forecastService.findById(id);
    return this.responsesService
      .code('success')
      .message('Forecast retrieved successfully')
      .sendResponse(res, forecast);
  }

  @Patch(':id')
  @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateForecastDto,
    @Res() res: any,
  ) {
    const forecast = await this.forecastService.update(id, updateDto);
    return this.responsesService
      .code('success')
      .message('Forecast updated successfully')
      .sendResponse(res, forecast);
  }

  @Delete(':id')
  @Roles('Admin')
  async remove(@Param('id') id: string, @Res() res: any) {
    await this.forecastService.remove(id);
    return this.responsesService
      .code('success')
      .message('Forecast deleted successfully')
      .sendResponse(res, null);
  }
}
