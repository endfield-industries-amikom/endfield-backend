import {
  Body,
  Controller,
  Delete,
  Post,
  Get,
  Patch,
  Request,
  Res,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dtos/signIn.dto';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { TokenDto, UserDto } from './dtos';
import { RegisterUserDto } from './dtos/register.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly responsesService: ResponsesService<
      TokenDto | UserDto | void
    >,
  ) {}
  private readonly logger = new Logger(AuthController.name);

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto, @Res() res: any) {
    const registerResponse = await this.authService.register(registerUserDto);
    return this.responsesService
      .code('created')
      .message('Registration successful')
      .sendResponse(res, registerResponse);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() signInDto: SignInDto,
    @Request() req: any,
    @Res() res: any,
  ) {
    const signInResponse = await this.authService.signIn(
      signInDto,
      req.session,
    );
    return this.responsesService
      .code('success')
      .message('Login successful')
      .sendResponse(res, signInResponse);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req: any, @Res() res: any) {
    const tokenData = await this.authService.refresh(req.session);
    return this.responsesService
      .code('success')
      .message('Token refreshed successfully')
      .sendResponse(res, tokenData);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Request() req: any, @Res() res: any) {
    await this.authService.logout(req.session);
    res.status(HttpStatus.NO_CONTENT).send();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Get('profile')
  async getProfile(@Request() req: { user: UserDto }, @Res() res: any) {
    const profile = await this.authService.profile(req.user.id ?? '');
    return this.responsesService
      .code('success')
      .message('Profile retrieved successfully')
      .sendResponse(res, profile);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Patch('profile')
  updateProfile(
    @Body() body: Partial<Pick<UserDto, 'username' | 'email'>>,
    @Request() req: { user: UserDto },
    @Res() res: any,
  ) {
    // Profile update delegated to users service; for now return success
    return this.responsesService
      .code('success')
      .message('Profile update endpoint')
      .sendResponse(res, null);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Delete('delete')
  async delete(@Request() req: { user: UserDto }, @Res() res: any) {
    this.logger.log(`Deleting user ${req.user.id}`);
    await this.authService.deleteUser(req.user.id ?? '');
    return this.responsesService
      .code('success')
      .message('Account deleted successfully')
      .sendResponse(res, null);
  }
}
