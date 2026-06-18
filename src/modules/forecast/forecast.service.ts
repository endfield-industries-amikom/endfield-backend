import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Forecast } from './forecast.entity';
import { CreateForecastDto, UpdateForecastDto } from './dtos';

@Injectable()
export class ForecastService {
  constructor(
    @InjectRepository(Forecast)
    private readonly forecastRepository: Repository<Forecast>,
  ) {}

  async create(createDto: CreateForecastDto): Promise<Forecast> {
    const forecast = this.forecastRepository.create(createDto);
    return this.forecastRepository.save(forecast);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Forecast[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.forecastRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Forecast> {
    const forecast = await this.forecastRepository.findOne({ where: { id } });
    if (!forecast) {
      throw new NotFoundException('Forecast not found');
    }
    return forecast;
  }

  async findByRegion(
    regionId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Forecast[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.forecastRepository.findAndCount({
      where: { regionId },
      skip: (page - 1) * limit,
      take: limit,
      order: { forecastDate: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async update(id: string, updateDto: UpdateForecastDto): Promise<Forecast> {
    const forecast = await this.findById(id);
    Object.assign(forecast, updateDto);
    return this.forecastRepository.save(forecast);
  }

  async remove(id: string): Promise<void> {
    const result = await this.forecastRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Forecast not found');
    }
  }
}
