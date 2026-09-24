import type { FastifyInstance } from 'fastify';
import { authenticate, requireAnyRole } from '../auth/auth.guards';
import { parsePagination } from '../../shared/pagination/pagination';
import { createIntegration, listIntegrations, updateIntegration } from './integration.service';
import { createIntegrationSchema, updateIntegrationSchema } from './integration.schemas';

export async function registerIntegrationRoutes(app: FastifyInstance): Promise<void> {
  const canManage = requireAnyRole(['ADMIN', 'MANAGER']);

  app.post(
    '/integrations',
    { preHandler: [authenticate, canManage], schema: { tags: ['Integrations'] } },
    async (request, reply) => {
      const integration = await createIntegration(request.auth!, createIntegrationSchema.parse(request.body));
      return reply.status(201).send(integration);
    },
  );

  app.get(
    '/integrations',
    { preHandler: [authenticate, canManage], schema: { tags: ['Integrations'] } },
    async (request) => listIntegrations(request.auth!, parsePagination(request.query)),
  );

  app.patch(
    '/integrations/:id',
    { preHandler: [authenticate, canManage], schema: { tags: ['Integrations'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      return updateIntegration(request.auth!, id, updateIntegrationSchema.parse(request.body));
    },
  );
}
