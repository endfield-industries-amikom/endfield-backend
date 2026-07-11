import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  private extractTokenFromHeader(req: Request): string | undefined {
    const authorizationHeader = req.headers['authorization'];
    if (authorizationHeader && typeof authorizationHeader === 'string') {
      return authorizationHeader.split(' ')[1];
    }
    return undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req: Request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(req);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      req['user'] = payload;
    } catch (error) {
      this.logger.error('Token verification failed', error);
      throw new UnauthorizedException();
    }
    return true;
  }
}
