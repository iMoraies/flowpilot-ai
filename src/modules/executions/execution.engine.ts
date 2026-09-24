import type { FastifyBaseLogger } from 'fastify';
import type { WorkflowStepType } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma';
import { createAIProvider } from '../../infrastructure/ai/ai-provider';
import { executeHttpRequest } from '../../infrastructure/http/safe-http-client';
import { LogNotificationProvider } from '../../infrastructure/notifications/notification-provider';
import { recordAudit } from '../audit/audit.service';
import { evaluateCondition, type ConditionConfig } from './condition-evaluator';
import { getByPath, setByPath, type ExecutionContext } from './context';

type SnapshotStep = {
  id: string;
  name: string;
  type: WorkflowStepType;
  configuration: Record<string, unknown>;
  nextStepId?: string | null;
  position: number;
};

type WorkflowSnapshot = {
  id: string;
  version: number;
  steps: SnapshotStep[];
};

function normalizeSnapshot(snapshot: unknown): WorkflowSnapshot {
  const candidate = snapshot as WorkflowSnapshot;
  return {
    id: candidate.id,
    version: candidate.version,
    steps: [...candidate.steps].sort((a, b) => a.position - b.position),
  };
}

function nextLinearStep(snapshot: WorkflowSnapshot, step: SnapshotStep): string | undefined {
  if (step.nextStepId) {
    return step.nextStepId;
  }

  return snapshot.steps.find((candidate) => candidate.position > step.position)?.id;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function processExecution(executionId: string, logger: FastifyBaseLogger): Promise<void> {
  const claimed = await prisma.execution.updateMany({
    where: {
      id: executionId,
      status: 'PENDING',
    },
    data: {
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  if (claimed.count === 0) {
    logger.info({ executionId }, 'execution skipped because it is not pending');
    return;
  }

  const execution = await prisma.execution.findUniqueOrThrow({
    where: { id: executionId },
  });
  const snapshot = normalizeSnapshot(execution.workflowSnapshot);
  const context: ExecutionContext = {
    input: execution.input as Record<string, unknown>,
    data: { input: execution.input },
  };
  const aiProvider = createAIProvider();
  const notificationProvider = new LogNotificationProvider(logger);
  let currentStepId: string | undefined = snapshot.steps[0]?.id;

  try {
    while (currentStepId) {
      const step = snapshot.steps.find((candidate) => candidate.id === currentStepId);
      if (!step) {
        throw new Error(`Step ${currentStepId} does not exist in execution snapshot`);
      }

      const startedAt = new Date();
      const executionStep = await prisma.executionStep.create({
        data: {
          executionId,
          workflowStepId: step.id,
          status: 'RUNNING',
          input: toJson(context.data),
          startedAt,
        },
      });

      const { output, nextStepId } = await executeStep(step, context, {
        organizationId: execution.organizationId,
        executionId,
        aiProvider,
        notificationProvider,
      });

      await prisma.executionStep.update({
        where: { id: executionStep.id },
        data: {
          status: 'SUCCESS',
          output: toJson(output),
          finishedAt: new Date(),
        },
      });

      currentStepId =
        step.configuration.end === true ? undefined : nextStepId ?? nextLinearStep(snapshot, step);
    }

    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'SUCCESS',
        output: toJson(context.data),
        finishedAt: new Date(),
      },
    });
    await recordAudit({
      organizationId: execution.organizationId,
      actorUserId: execution.createdBy,
      action: 'WORKFLOW_EXECUTION_COMPLETED',
      entityType: 'Execution',
      entityId: executionId,
    });
  } catch (error) {
    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        error: toJson({ message: error instanceof Error ? error.message : 'Unknown execution error' }),
        finishedAt: new Date(),
      },
    });
    await recordAudit({
      organizationId: execution.organizationId,
      actorUserId: execution.createdBy,
      action: 'WORKFLOW_EXECUTION_FAILED',
      entityType: 'Execution',
      entityId: executionId,
      metadata: { message: error instanceof Error ? error.message : 'Unknown execution error' },
    });
    throw error;
  }
}

async function executeStep(
  step: SnapshotStep,
  context: ExecutionContext,
  providers: {
    organizationId: string;
    executionId: string;
    aiProvider: ReturnType<typeof createAIProvider>;
    notificationProvider: LogNotificationProvider;
  },
): Promise<{ output: unknown; nextStepId?: string }> {
  switch (step.type) {
    case 'MANUAL':
      return { output: { passedThrough: true } };
    case 'HTTP_REQUEST': {
      const output = await executeHttpRequest({
        method: String(step.configuration.method),
        url: String(step.configuration.url),
        headers: step.configuration.headers as Record<string, string> | undefined,
        body: step.configuration.body,
        timeoutMs: Number(step.configuration.timeoutMs ?? 5000),
        retries: Number(step.configuration.retries ?? 1),
      });
      setByPath(context.data, String(step.configuration.outputKey ?? 'http'), output);
      await recordAudit({
        organizationId: providers.organizationId,
        action: 'INTEGRATION_CALLED',
        entityType: 'Execution',
        entityId: providers.executionId,
        metadata: { stepId: step.id, status: output.status },
      });
      return { output };
    }
    case 'AI_CLASSIFICATION': {
      const text = String(getByPath(context.data, String(step.configuration.inputPath)) ?? '');
      const categories = step.configuration.categories as string[];
      const classification = await providers.aiProvider.classify({
        text,
        categories,
        instructions: step.configuration.instructions as string | undefined,
      });
      if (!categories.includes(classification.category)) {
        throw new Error('AI provider returned an invalid category');
      }
      setByPath(context.data, String(step.configuration.outputKey ?? 'classification'), classification.category);
      return { output: classification };
    }
    case 'CONDITION': {
      const condition = step.configuration as ConditionConfig;
      const result = evaluateCondition(context.data, condition);
      return {
        output: { result },
        nextStepId: result ? condition.onTrue : condition.onFalse,
      };
    }
    case 'CREATE_TASK': {
      const task = await prisma.task.create({
        data: {
          organizationId: providers.organizationId,
          executionId: providers.executionId,
          workflowStepId: step.id,
          title: String(step.configuration.title),
          description: step.configuration.description
            ? String(step.configuration.description)
            : undefined,
        },
      });
      await recordAudit({
        organizationId: providers.organizationId,
        action: 'TASK_CREATED',
        entityType: 'Task',
        entityId: task.id,
      });
      setByPath(context.data, String(step.configuration.outputKey ?? 'taskId'), task.id);
      return { output: task };
    }
    case 'NOTIFICATION':
      await providers.notificationProvider.send({
        organizationId: providers.organizationId,
        executionId: providers.executionId,
        message: String(step.configuration.message),
        channel: step.configuration.channel ? String(step.configuration.channel) : undefined,
      });
      return { output: { notified: true } };
  }
}
