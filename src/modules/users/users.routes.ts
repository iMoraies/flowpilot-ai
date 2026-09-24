import type { FastifyInstance } from 'fastify';
import { authenticate, requireAnyRole } from '../auth/auth.guards';
import { createUserSchema, updateUserRoleSchema, usersJsonSchemas } from './users.schemas';
import { UsersService } from './users.service';

export async function registerUsersRoutes(app: FastifyInstance): Promise<void> {
  const usersService = new UsersService(app.authRepository);

  app.get(
    '/users',
    {
      preHandler: [authenticate, requireAnyRole(['ADMIN', 'MANAGER'])],
      schema: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'array',
            items: { $ref: 'PublicUser#' },
          },
          401: { $ref: 'ErrorResponse#' },
          403: { $ref: 'ErrorResponse#' },
        },
      },
    },
    async (request) => {
      return usersService.listUsers(request.auth!);
    },
  );

  app.post(
    '/users',
    {
      preHandler: [authenticate, requireAnyRole(['ADMIN'])],
      schema: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        body: usersJsonSchemas.createUserBody,
        response: {
          201: { $ref: 'PublicUser#' },
          400: { $ref: 'ErrorResponse#' },
          401: { $ref: 'ErrorResponse#' },
          403: { $ref: 'ErrorResponse#' },
          409: { $ref: 'ErrorResponse#' },
        },
      },
    },
    async (request, reply) => {
      const body = createUserSchema.parse(request.body);
      const user = await usersService.createUser(request.auth!, body);
      request.log.info({ createdUserId: user.id }, 'user created');
      return reply.status(201).send(user);
    },
  );

  app.patch(
    '/users/:id/role',
    {
      preHandler: [authenticate, requireAnyRole(['ADMIN'])],
      schema: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: usersJsonSchemas.updateUserRoleBody,
        response: {
          200: { $ref: 'PublicUser#' },
          400: { $ref: 'ErrorResponse#' },
          401: { $ref: 'ErrorResponse#' },
          403: { $ref: 'ErrorResponse#' },
          404: { $ref: 'ErrorResponse#' },
        },
      },
    },
    async (request) => {
      const params = request.params as { id: string };
      const body = updateUserRoleSchema.parse(request.body);
      const user = await usersService.updateRole(request.auth!, params.id, body);
      request.log.info({ targetUserId: user.id, role: user.role }, 'role changed');
      return user;
    },
  );
}
