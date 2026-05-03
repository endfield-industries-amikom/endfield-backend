import {
  Body,
  Controller,
  Delete,
  Post,
  Request,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dtos/signIn.dto';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { JwtDto, TokenDto } from './dtos';
import { RegisterUserDto } from './dtos/register.dto';
import { AuthGuard } from './auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly responsesService: ResponsesService<TokenDto>,
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

  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer')
  @Delete('delete')
  async delete(@Res() res: any, @Request() req: JwtDto) {
    this.logger.log('Deleting user', req.user);
    await this.authService.deleteUser(req.user.sub ?? '');
    return this.responsesService
      .code('success')
      .message('Account deleted successfully')
      .sendResponse(res, null);
  }
}
