import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ResponsesService } from '../utils/responses/responses.service';
import { AdminService } from './admin.service';
import { CreateUserByAdminDto } from './dtos';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly responsesService: ResponsesService<any>,
  ) {}

  @Post('users')
  @Roles('Admin')
  async createUser(
    @Body() dto: CreateUserByAdminDto,
    @Res() res: any,
  ) {
    const user = await this.adminService.createUser(dto);
    return this.responsesService
      .code('created')
      .message('User created successfully')
      .sendResponse(res, user);
  }

  @Get('users')
  @Roles('Admin')
  async listUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('roleName') roleName: string[],
    @Res() res: any,
  ) {
    const result = await this.adminService.listUsers(
      Number(page) || 1,
      Number(limit) || 10,
      roleName || ['Employee', 'Editor'],
    );
    return this.responsesService
      .code('success')
      .message('Users retrieved successfully')
      .sendResponse(res, result);
  }

  @Get('users/:id')
  @Roles('Admin')
  async getUserById(@Param('id') id: string, @Res() res: any) {
    const user = await this.adminService.getUserById(id);
    return this.responsesService
      .code('success')
      .message('User retrieved successfully')
      .sendResponse(res, user);
  }

  @Delete('users/:id')
  @Roles('Admin')
  async deleteUser(@Param('id') id: string, @Res() res: any) {
    await this.adminService.deleteUser(id);
    return this.responsesService
      .code('success')
      .message('User deleted successfully')
      .sendResponse(res, null);
  }
}
