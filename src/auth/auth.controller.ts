import {
  Body,
  Controller,
  Delete,
  Post,
  Request,
  Res,
  UseGuards,
  Logger,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dtos/signIn.dto';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { TokenDto, UserDto } from './dtos';
import { RegisterUserDto } from './dtos/register.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly responsesService: ResponsesService<TokenDto | UserDto>,
  ) {}
  private readonly logger = new Logger(AuthController.name);

  @Post('register')
  async register(@Body() RegisterUserDto: RegisterUserDto, @Res() res: any) {
    const registerResponse = await this.authService.register(RegisterUserDto);
    return this.responsesService
      .code('success')
      .message('Registration successful')
      .sendResponse(res, registerResponse);
  }

  @Post('login')
  async login(@Body() signInDto: SignInDto, @Res() res: any) {
    const signInResponse = await this.authService.signIn(signInDto);
    return this.responsesService
      .code('success')
      .message('Login successful')
      .sendResponse(res, signInResponse);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Get('profile')
  async getProfile(@Res() res: any, @Request() req: { user: UserDto }) {
    const profile = await this.authService.profile(req.user.id ?? '');
    return this.responsesService
      .code('success')
      .message('Profile retrieved successfully')
      .sendResponse(res, profile);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Delete('delete')
  async delete(@Res() res: any, @Request() req: { user: UserDto }) {
    this.logger.log(`Deleting user ${req.user.id}`);
    await this.authService.deleteUser(req.user.id ?? '');
    return this.responsesService
      .code('success')
      .message('Account deleted successfully')
      .sendResponse(res, null);
  }
}
