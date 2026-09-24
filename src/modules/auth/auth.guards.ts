import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserRole } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { verifyAccessToken } from './access-token';

export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new AppError('AUTH_TOKEN_INVALID', 'Authentication token is required', 401);
  }

  const token = authorizationHeader.slice('Bearer '.length);

  try {
    request.auth = await verifyAccessToken(request.server, token);
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('expired')) {
      throw new AppError('AUTH_TOKEN_EXPIRED', 'Access token has expired', 401);
    }

    throw new AppError('AUTH_TOKEN_INVALID', 'Invalid access token', 401);
  }
}

export function requireAnyRole(roles: UserRole[]) {
  return async function requireRole(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!request.auth) {
      throw new AppError('AUTH_TOKEN_INVALID', 'Authentication token is required', 401);
    }

    if (!roles.includes(request.auth.role)) {
      throw new AppError('AUTH_FORBIDDEN', 'Insufficient role for this operation', 403);
    }
  };
}
