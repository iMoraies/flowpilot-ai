import type { FastifyInstance } from 'fastify';
import { authenticate, requireAnyRole } from '../auth/auth.guards';
import { parsePagination } from '../../shared/pagination/pagination';
import { getTask, listTasks, updateTask } from './task.service';
import { taskQuerySchema, updateTaskSchema } from './task.schemas';

export async function registerTaskRoutes(app: FastifyInstance): Promise<void> {
  const canUseTasks = requireAnyRole(['ADMIN', 'MANAGER', 'MEMBER']);

  app.get(
    '/tasks',
    { preHandler: [authenticate, canUseTasks], schema: { tags: ['Tasks'] } },
    async (request) =>
      listTasks(request.auth!, parsePagination(request.query), taskQuerySchema.parse(request.query)),
  );

  app.get(
    '/tasks/:id',
    { preHandler: [authenticate, canUseTasks], schema: { tags: ['Tasks'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      return getTask(request.auth!, id);
    },
  );

  app.patch(
    '/tasks/:id',
    { preHandler: [authenticate, canUseTasks], schema: { tags: ['Tasks'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      return updateTask(request.auth!, id, updateTaskSchema.parse(request.body));
    },
  );
}
