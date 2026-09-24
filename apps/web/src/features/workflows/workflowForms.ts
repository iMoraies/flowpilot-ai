import type { WorkflowStepType } from '../../types/api';

export const stepTypes: WorkflowStepType[] = [
  'MANUAL',
  'HTTP_REQUEST',
  'AI_CLASSIFICATION',
  'CONDITION',
  'CREATE_TASK',
  'NOTIFICATION',
];

export function parseConfiguration(value: string): Record<string, unknown> {
  if (!value.trim()) {
    return {};
  }

  const parsed = JSON.parse(value) as unknown;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Configuration must be a JSON object.');
  }

  return parsed as Record<string, unknown>;
}
