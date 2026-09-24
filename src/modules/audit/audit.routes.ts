import type { FastifyInstance } from 'fastify';
import { authenticate, requireAnyRole } from '../auth/auth.guards';
import { listAuditLogs } from './audit.service';
import { parsePagination } from '../../shared/pagination/pagination';

export async function registerAuditRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/audit-logs',
    {
      preHandler: [authenticate, requireAnyRole(['ADMIN', 'MANAGER'])],
      schema: {
        tags: ['Audit'],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request) => listAuditLogs(request.auth!, parsePagination(request.query)),
  );
}
