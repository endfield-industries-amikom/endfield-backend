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
import { BlogsService } from './blogs.service';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { CreateBlogDto, UpdateBlogDto } from './dtos';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Blog')
@Controller('blog')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('bearer')
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Get()
  @Public()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Res() res: any,
  ) {
    const data = await this.blogsService.findAll(page, limit);
    return this.responsesService
      .code('success')
      .message('Blogs retrieved successfully')
      .sendResponse(res, data);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    const data = await this.blogsService.findOne(id);
    return this.responsesService
      .code('success')
      .message('Blog retrieved successfully')
      .sendResponse(res, data);
  }

  @Post()
  @Roles('Admin', 'Editor')
  async create(@Body() createBlogDto: CreateBlogDto, @Res() res: any) {
    const data = await this.blogsService.create(createBlogDto);
    return this.responsesService
      .code('created')
      .message('Blog created successfully')
      .sendResponse(res, data);
  }

  @Patch(':id')
  @Roles('Admin', 'Editor')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @Res() res: any,
  ) {
    const data = await this.blogsService.update(id, updateBlogDto);
    return this.responsesService
      .code('success')
      .message('Blog updated successfully')
      .sendResponse(res, data);
  }

  @Delete(':id')
  @Roles('Admin', 'Editor')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    await this.blogsService.remove(id);
    return this.responsesService
      .code('success')
      .message('Blog deleted successfully')
      .sendResponse(res, null);
  }
}
