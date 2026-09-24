import type { WorkflowStep, WorkflowStepType } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error';

type StepLike = Pick<WorkflowStep, 'id' | 'name' | 'type' | 'configuration' | 'nextStepId'>;

function asConfig(step: StepLike): Record<string, unknown> {
  return typeof step.configuration === 'object' && step.configuration !== null
    ? (step.configuration as Record<string, unknown>)
    : {};
}

function requireString(config: Record<string, unknown>, field: string, step: StepLike): void {
  if (typeof config[field] !== 'string' || config[field] === '') {
    throw new AppError('WORKFLOW_INVALID_STEP', `${step.type} step "${step.name}" requires ${field}`, 422);
  }
}

function requireArray(config: Record<string, unknown>, field: string, step: StepLike): void {
  if (!Array.isArray(config[field]) || config[field].length === 0) {
    throw new AppError('WORKFLOW_INVALID_STEP', `${step.type} step "${step.name}" requires ${field}`, 422);
  }
}

export function validateStepConfiguration(type: WorkflowStepType, config: Record<string, unknown>): void {
  if (type === 'HTTP_REQUEST') {
    const step = { id: '', name: 'HTTP_REQUEST', type, configuration: {}, nextStepId: null };
    requireString(config, 'method', step);
    requireString(config, 'url', step);
  }
}

export function validateWorkflowForActivation(steps: StepLike[]): void {
  if (steps.length === 0) {
    throw new AppError('WORKFLOW_INVALID', 'Workflow must have at least one step before activation', 422);
  }

  const stepIds = new Set(steps.map((step) => step.id));

  for (const step of steps) {
    const config = asConfig(step);

    if (step.nextStepId && !stepIds.has(step.nextStepId)) {
      throw new AppError('WORKFLOW_INVALID', `Step "${step.name}" references an invalid nextStepId`, 422);
    }

    switch (step.type) {
      case 'HTTP_REQUEST':
        requireString(config, 'method', step);
        requireString(config, 'url', step);
        break;
      case 'AI_CLASSIFICATION':
        requireString(config, 'inputPath', step);
        requireArray(config, 'categories', step);
        break;
      case 'CONDITION':
        requireString(config, 'field', step);
        requireString(config, 'operator', step);
        requireString(config, 'onTrue', step);
        if (!stepIds.has(config.onTrue as string)) {
          throw new AppError('WORKFLOW_INVALID', `Condition "${step.name}" has invalid onTrue`, 422);
        }
        if (typeof config.onFalse === 'string' && !stepIds.has(config.onFalse)) {
          throw new AppError('WORKFLOW_INVALID', `Condition "${step.name}" has invalid onFalse`, 422);
        }
        break;
      case 'CREATE_TASK':
        requireString(config, 'title', step);
        break;
      case 'NOTIFICATION':
        requireString(config, 'message', step);
        break;
      case 'MANUAL':
        break;
    }
  }
}
