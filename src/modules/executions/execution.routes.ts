import type { FastifyInstance } from 'fastify';
import type { Env } from '../../config/env';
import { authenticate, requireAnyRole } from '../auth/auth.guards';
import { parsePagination } from '../../shared/pagination/pagination';
import { createExecutionSchema, executionQuerySchema } from './execution.schemas';
import { createWorkflowExecution, getExecution, listExecutions } from './execution.service';

export async function registerExecutionRoutes(app: FastifyInstance, env: Env): Promise<void> {
  const canExecute = requireAnyRole(['ADMIN', 'MANAGER', 'MEMBER']);

  app.post(
    '/workflows/:id/executions',
    { preHandler: [authenticate, canExecute], schema: { tags: ['Executions'] } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const idempotencyHeader = request.headers['idempotency-key'];
      const idempotencyKey = Array.isArray(idempotencyHeader) ? idempotencyHeader[0] : idempotencyHeader;
      const execution = await createWorkflowExecution(
        request.auth!,
        env,
        id,
        createExecutionSchema.parse(request.body),
        idempotencyKey,
      );
      return reply.status(202).send(execution);
    },
  );

  app.get(
    '/executions',
    { preHandler: [authenticate, canExecute], schema: { tags: ['Executions'] } },
    async (request) =>
      listExecutions(request.auth!, parsePagination(request.query), executionQuerySchema.parse(request.query)),
  );

  app.get(
    '/executions/:id',
    { preHandler: [authenticate, canExecute], schema: { tags: ['Executions'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      return getExecution(request.auth!, id);
    },
  );
}
