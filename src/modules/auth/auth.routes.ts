import type { FastifyInstance } from 'fastify';
import type { Env } from '../../config/env';
import { authenticate } from './auth.guards';
import { AuthService } from './auth.service';
import {
  authJsonSchemas,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from './auth.schemas';

export async function registerAuthRoutes(app: FastifyInstance, env: Env): Promise<void> {
  const authService = new AuthService(app.authRepository, app, env);

  app.post(
    '/auth/register',
    {
      config: {
        rateLimit: {
          max: env.AUTH_RATE_LIMIT_MAX,
          timeWindow: env.AUTH_RATE_LIMIT_WINDOW,
        },
      },
      schema: {
        tags: ['Auth'],
        body: authJsonSchemas.registerBody,
        response: {
          201: {
            type: 'object',
            required: ['accessToken', 'refreshToken', 'user', 'organization'],
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              user: { $ref: 'PublicUser#' },
              organization: { $ref: 'PublicOrganization#' },
            },
          },
          400: { $ref: 'ErrorResponse#' },
          409: { $ref: 'ErrorResponse#' },
        },
      },
    },
    async (request, reply) => {
      const body = registerSchema.parse(request.body);
      const response = await authService.register(body);

      request.log.info(
        { userId: response.user.id, organizationId: response.user.organizationId },
        'user created',
      );

      return reply.status(201).send(response);
    },
  );

  app.post(
    '/auth/login',
    {
      config: {
        rateLimit: {
          max: env.AUTH_RATE_LIMIT_MAX,
          timeWindow: env.AUTH_RATE_LIMIT_WINDOW,
        },
      },
      schema: {
        tags: ['Auth'],
        body: authJsonSchemas.loginBody,
        response: {
          200: authJsonSchemas.authResponse,
          400: { $ref: 'ErrorResponse#' },
          401: { $ref: 'ErrorResponse#' },
        },
      },
    },
    async (request) => {
      const body = loginSchema.parse(request.body);

      try {
        const response = await authService.login(body);
        request.log.info(
          { userId: response.user.id, organizationId: response.user.organizationId },
          'login success',
        );
        return response;
      } catch (error) {
        request.log.warn('login failure');
        throw error;
      }
    },
  );

  app.post(
    '/auth/refresh',
    {
      config: {
        rateLimit: {
          max: env.AUTH_RATE_LIMIT_MAX,
          timeWindow: env.AUTH_RATE_LIMIT_WINDOW,
        },
      },
      schema: {
        tags: ['Auth'],
        body: authJsonSchemas.refreshBody,
        response: {
          200: authJsonSchemas.authResponse,
          400: { $ref: 'ErrorResponse#' },
          401: { $ref: 'ErrorResponse#' },
        },
      },
    },
    async (request) => {
      const body = refreshSchema.parse(request.body);
      const response = await authService.refresh(body.refreshToken);
      request.log.info(
        { userId: response.user.id, organizationId: response.user.organizationId },
        'refresh',
      );
      return response;
    },
  );

  app.post(
    '/auth/logout',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        body: authJsonSchemas.refreshBody,
        response: {
          204: { type: 'null' },
          400: { $ref: 'ErrorResponse#' },
          401: { $ref: 'ErrorResponse#' },
        },
      },
    },
    async (request, reply) => {
      const body = logoutSchema.parse(request.body);
      await authService.logout(body.refreshToken);
      request.log.info('logout');
      return reply.status(204).send();
    },
  );

  app.get(
    '/auth/me',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        response: {
          200: { $ref: 'PublicUser#' },
          401: { $ref: 'ErrorResponse#' },
        },
      },
    },
    async (request) => {
      return authService.getMe(request.auth!.userId);
    },
  );
}
