import type { AuthRepository } from '../../modules/auth/auth.repository';
import type { AuthenticatedUser } from '../../modules/auth/auth.types';

declare module 'fastify' {
  interface FastifyInstance {
    authRepository: AuthRepository;
  }

  interface FastifyRequest {
    auth?: AuthenticatedUser;
  }
}
