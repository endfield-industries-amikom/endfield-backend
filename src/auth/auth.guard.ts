import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  private extractTokenFromHeader(req: Request): string | undefined {
    const authorizationHeader = req.headers['authorization'];
    if (authorizationHeader && typeof authorizationHeader === 'string') {
      return authorizationHeader.split(' ')[1];
    }
    return undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
