import 'fastify';

declare module 'fastify' {
  interface Session {
    userId?: string;
    refreshToken?: string;
    createdAt?: Date;
    expiresAt?: Date;
  }
}
