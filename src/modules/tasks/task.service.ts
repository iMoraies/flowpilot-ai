import { prisma } from '../../infrastructure/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import type { Pagination } from '../../shared/pagination/pagination';
import { toPaginatedResult } from '../../shared/pagination/pagination';
import type { AuthenticatedUser } from '../auth/auth.types';
import { recordAudit } from '../audit/audit.service';
import type { UpdateTaskBody } from './task.schemas';

export async function listTasks(
  auth: AuthenticatedUser,
  pagination: Pagination,
  filters: { status?: string },
) {
  const where = {
    organizationId: auth.organizationId,
    status: filters.status as never,
  };
  const [data, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pagination.limit,
      skip: pagination.offset,
    }),
    prisma.task.count({ where }),
  ]);

  return toPaginatedResult(data, pagination, total);
}

export async function getTask(auth: AuthenticatedUser, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, organizationId: auth.organizationId },
  });

  if (!task) {
    throw new AppError('TASK_NOT_FOUND', 'Task not found', 404);
  }

  return task;
}

export async function updateTask(auth: AuthenticatedUser, taskId: string, input: UpdateTaskBody) {
  const existing = await getTask(auth, taskId);

  if (input.assignedTo) {
    const assignee = await prisma.user.findFirst({
      where: {
        id: input.assignedTo,
        organizationId: auth.organizationId,
      },
    });

    if (!assignee) {
      throw new AppError('USER_NOT_FOUND', 'Assignee not found in organization', 404);
    }
  }

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      status: input.status,
      assignedTo: input.assignedTo,
      completedAt: input.status === 'DONE' ? new Date() : undefined,
    },
  });

  if (input.status === 'DONE') {
    await recordAudit({
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      action: 'TASK_COMPLETED',
      entityType: 'Task',
      entityId: task.id,
    });
  }

  return task;
}
