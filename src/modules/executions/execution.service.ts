import type { Env } from '../../config/env';
import { prisma } from '../../infrastructure/database/prisma';
import { getWorkflowExecutionQueue } from '../../infrastructure/queue/workflow-queue';
import { AppError } from '../../shared/errors/app-error';
import type { Pagination } from '../../shared/pagination/pagination';
import { toPaginatedResult } from '../../shared/pagination/pagination';
import type { AuthenticatedUser } from '../auth/auth.types';
import { recordAudit } from '../audit/audit.service';
import type { CreateExecutionBody } from './execution.schemas';

export async function createWorkflowExecution(
  auth: AuthenticatedUser,
  env: Env,
  workflowId: string,
  input: CreateExecutionBody,
  idempotencyKey?: string,
) {
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: workflowId,
      organizationId: auth.organizationId,
      status: 'ACTIVE',
    },
    include: {
      steps: {
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!workflow) {
    throw new AppError('WORKFLOW_NOT_FOUND', 'Active workflow not found', 404);
  }

  if (idempotencyKey) {
    const existing = await prisma.execution.findUnique({
      where: {
        organizationId_workflowId_idempotencyKey: {
          organizationId: auth.organizationId,
          workflowId,
          idempotencyKey,
        },
      },
    });

    if (existing) {
      return existing;
    }
  }

  const execution = await prisma.execution.create({
    data: {
      organizationId: auth.organizationId,
      workflowId,
      workflowVersion: workflow.version,
      workflowSnapshot: {
        id: workflow.id,
        version: workflow.version,
        steps: workflow.steps,
      },
      input: input.input as never,
      createdBy: auth.userId,
      idempotencyKey,
    },
  });

  await getWorkflowExecutionQueue(env).add(
    'execute-workflow',
    { executionId: execution.id },
    { jobId: execution.id },
  );

  await recordAudit({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    action: 'WORKFLOW_EXECUTION_STARTED',
    entityType: 'Execution',
    entityId: execution.id,
    metadata: { workflowId, workflowVersion: workflow.version },
  });

  return execution;
}

export async function listExecutions(
  auth: AuthenticatedUser,
  pagination: Pagination,
  filters: { workflowId?: string; status?: string; from?: Date; to?: Date },
) {
  const where = {
    organizationId: auth.organizationId,
    workflowId: filters.workflowId,
    status: filters.status as never,
    createdAt: {
      gte: filters.from,
      lte: filters.to,
    },
  };

  const [data, total] = await Promise.all([
    prisma.execution.findMany({
      where,
      include: { steps: true, tasks: true },
      orderBy: { createdAt: 'desc' },
      take: pagination.limit,
      skip: pagination.offset,
    }),
    prisma.execution.count({ where }),
  ]);

  return toPaginatedResult(data, pagination, total);
}

export async function getExecution(auth: AuthenticatedUser, executionId: string) {
  const execution = await prisma.execution.findFirst({
    where: {
      id: executionId,
      organizationId: auth.organizationId,
    },
    include: {
      steps: true,
      tasks: true,
    },
  });

  if (!execution) {
    throw new AppError('EXECUTION_NOT_FOUND', 'Execution not found', 404);
  }

  return execution;
}
