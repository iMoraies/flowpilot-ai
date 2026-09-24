import type { FastifyInstance } from 'fastify';
import type { UserRole } from '@prisma/client';
import type { Env } from '../../config/env';
import type { AuthenticatedUser } from './auth.types';

type JwtPayload = {
  sub: string;
  organizationId: string;
  role: UserRole;
};

export function issueAccessToken(
  app: FastifyInstance,
  env: Env,
  user: AuthenticatedUser,
): string {
  return app.jwt.sign(
    {
      sub: user.userId,
      organizationId: user.organizationId,
      role: user.role,
    },
    {
      expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    },
  );
}

export async function verifyAccessToken(
  app: FastifyInstance,
  token: string,
): Promise<AuthenticatedUser> {
  const payload = await app.jwt.verify<JwtPayload>(token);

  if (!payload.sub || !payload.organizationId || !payload.role) {
    throw new Error('Invalid access token payload');
  }

  return {
    userId: payload.sub,
    organizationId: payload.organizationId,
    role: payload.role,
  };
}
