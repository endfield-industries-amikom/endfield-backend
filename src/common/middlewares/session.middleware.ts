import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SessionMiddleware.name);

  use(req: FastifyRequest, _res: FastifyReply, next: () => void): void {
    // Fastify session is registered as a plugin; this middleware is a hook point
    // for any additional session-related logic (e.g. audit logging).
    if (req.session && req.session.userId) {
      this.logger.debug(`Session active for user: ${req.session.userId}`);
    }
    next();
  }
}
