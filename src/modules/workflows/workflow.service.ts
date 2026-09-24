import type { Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import type { Pagination } from '../../shared/pagination/pagination';
import { toPaginatedResult } from '../../shared/pagination/pagination';
import type { AuthenticatedUser } from '../auth/auth.types';
import { recordAudit } from '../audit/audit.service';
import type { CreateStepBody, CreateWorkflowBody, UpdateStepBody, UpdateWorkflowBody } from './workflow.schemas';
import { validateWorkflowForActivation } from './workflow.validation';

const workflowInclude = {
  steps: {
    orderBy: { position: 'asc' as const },
  },
};

export async function createWorkflow(auth: AuthenticatedUser, input: CreateWorkflowBody) {
  const workflow = await prisma.workflow.create({
    data: {
      organizationId: auth.organizationId,
      createdBy: auth.userId,
      name: input.name,
      description: input.description,
    },
    include: workflowInclude,
  });

  await recordAudit({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    action: 'WORKFLOW_CREATED',
    entityType: 'Workflow',
    entityId: workflow.id,
  });

  return workflow;
}

export async function listWorkflows(auth: AuthenticatedUser, pagination: Pagination) {
  const where = { organizationId: auth.organizationId };
  const [data, total] = await Promise.all([
    prisma.workflow.findMany({
      where,
      include: workflowInclude,
      orderBy: { createdAt: 'desc' },
      take: pagination.limit,
      skip: pagination.offset,
    }),
    prisma.workflow.count({ where }),
  ]);

  return toPaginatedResult(data, pagination, total);
}

export async function getWorkflow(auth: AuthenticatedUser, workflowId: string) {
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, organizationId: auth.organizationId },
    include: workflowInclude,
  });

  if (!workflow) {
    throw new AppError('WORKFLOW_NOT_FOUND', 'Workflow not found', 404);
  }

  return workflow;
}

export async function updateWorkflow(auth: AuthenticatedUser, workflowId: string, input: UpdateWorkflowBody) {
  await getWorkflow(auth, workflowId);
  const workflow = await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      ...input,
      version: { increment: 1 },
      status: 'DRAFT',
    },
    include: workflowInclude,
  });

  await recordAudit({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    action: 'WORKFLOW_UPDATED',
    entityType: 'Workflow',
    entityId: workflow.id,
  });

  return workflow;
}

export async function deleteWorkflow(auth: AuthenticatedUser, workflowId: string) {
  const workflow = await getWorkflow(auth, workflowId);

  if (workflow.status === 'ACTIVE') {
    throw new AppError('WORKFLOW_ACTIVE_DELETE_FORBIDDEN', 'Deactivate workflow before deleting it', 409);
  }

  await prisma.workflow.delete({ where: { id: workflowId } });
}

export async function addWorkflowStep(auth: AuthenticatedUser, workflowId: string, input: CreateStepBody) {
  await getWorkflow(auth, workflowId);

  const step = await prisma.workflowStep.create({
    data: {
      workflowId,
      name: input.name,
      type: input.type,
      configuration: input.configuration as Prisma.InputJsonValue,
      position: input.position,
      nextStepId: input.nextStepId ?? null,
    },
  });

  await prisma.workflow.update({
    where: { id: workflowId },
    data: { version: { increment: 1 }, status: 'DRAFT' },
  });

  return step;
}

export async function updateWorkflowStep(
  auth: AuthenticatedUser,
  workflowId: string,
  stepId: string,
  input: UpdateStepBody,
) {
  await getWorkflow(auth, workflowId);
  const existingStep = await prisma.workflowStep.findFirst({ where: { id: stepId, workflowId } });

  if (!existingStep) {
    throw new AppError('WORKFLOW_STEP_NOT_FOUND', 'Workflow step not found', 404);
  }

  const step = await prisma.workflowStep.update({
    where: { id: stepId },
    data: {
      name: input.name,
      type: input.type,
      configuration: input.configuration as Prisma.InputJsonValue | undefined,
      position: input.position,
      nextStepId: input.nextStepId,
    },
  });

  await prisma.workflow.update({
    where: { id: workflowId },
    data: { version: { increment: 1 }, status: 'DRAFT' },
  });

  return step;
}

export async function deleteWorkflowStep(auth: AuthenticatedUser, workflowId: string, stepId: string) {
  await getWorkflow(auth, workflowId);
  const existingStep = await prisma.workflowStep.findFirst({ where: { id: stepId, workflowId } });

  if (!existingStep) {
    throw new AppError('WORKFLOW_STEP_NOT_FOUND', 'Workflow step not found', 404);
  }

  await prisma.workflowStep.delete({ where: { id: stepId } });
  await prisma.workflow.update({
    where: { id: workflowId },
    data: { version: { increment: 1 }, status: 'DRAFT' },
  });
}

export async function activateWorkflow(auth: AuthenticatedUser, workflowId: string) {
  const workflow = await getWorkflow(auth, workflowId);
  validateWorkflowForActivation(workflow.steps);

  const activated = await prisma.workflow.update({
    where: { id: workflowId },
    data: { status: 'ACTIVE' },
    include: workflowInclude,
  });

  await recordAudit({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    action: 'WORKFLOW_ACTIVATED',
    entityType: 'Workflow',
    entityId: workflowId,
  });

  return activated;
}

export async function deactivateWorkflow(auth: AuthenticatedUser, workflowId: string) {
  await getWorkflow(auth, workflowId);
  return prisma.workflow.update({
    where: { id: workflowId },
    data: { status: 'INACTIVE' },
    include: workflowInclude,
  });
}
