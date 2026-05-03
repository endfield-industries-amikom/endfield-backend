import {
  Controller,
  Post,
  Body,
  Delete,
  Res,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  DeleteUserDto,
  RegisterUserDto,
  loginUserDto,
  UserDto,
} from './dtos/index';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { User } from './users.entity';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly responsesService: ResponsesService<UserDto>,
  ) {}

  private toUserDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto, @Res() res: any) {
    try {
      const user = await this.usersService.register(registerUserDto);
      const userDto = this.toUserDto(user);
      return this.responsesService
        .code('success')
        .message('Register Success')
        .sendResponse(res, userDto);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error);
    }
  }

  @Post('login')
  async login(@Body() loginUserDto: loginUserDto, @Res() res: any) {
    try {
      const user = await this.usersService.login(loginUserDto);
      const userDto = this.toUserDto(user);
      this.responsesService
        .code('success')
        .message('Login Success')
        .sendResponse(res, userDto);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.message);
    }
  }

  @Delete('delete')
  async deleteUser(@Body() deleteUserDto: DeleteUserDto, @Res() res: any) {
    try {
      await this.usersService.deleteUser(deleteUserDto);
      this.responsesService
        .code('success')
        .message('Delete Success')
        .sendResponse(res, null);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error);
    }
  }
}
