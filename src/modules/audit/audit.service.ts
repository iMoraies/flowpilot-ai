import type { Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { Pagination } from '../../shared/pagination/pagination';
import { toPaginatedResult } from '../../shared/pagination/pagination';

export type AuditAction =
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGOUT'
  | 'USER_CREATED'
  | 'USER_ROLE_CHANGED'
  | 'WORKFLOW_CREATED'
  | 'WORKFLOW_UPDATED'
  | 'WORKFLOW_ACTIVATED'
  | 'WORKFLOW_EXECUTION_STARTED'
  | 'WORKFLOW_EXECUTION_COMPLETED'
  | 'WORKFLOW_EXECUTION_FAILED'
  | 'TASK_CREATED'
  | 'TASK_COMPLETED'
  | 'INTEGRATION_CALLED';

type RecordAuditInput = {
  organizationId: string;
  actorUserId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

export async function recordAudit(input: RecordAuditInput): Promise<void> {
  if (process.env.VITEST) {
    return;
  }

  await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
}

export async function listAuditLogs(auth: AuthenticatedUser, pagination: Pagination) {
  const where = {
    organizationId: auth.organizationId,
  };
  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pagination.limit,
      skip: pagination.offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return toPaginatedResult(data, pagination, total);
}
