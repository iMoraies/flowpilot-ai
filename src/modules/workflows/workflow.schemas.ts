import { z } from 'zod';

export const workflowStepTypeSchema = z.enum([
  'MANUAL',
  'HTTP_REQUEST',
  'AI_CLASSIFICATION',
  'CONDITION',
  'CREATE_TASK',
  'NOTIFICATION',
]);

export const createWorkflowSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional(),
});

export const updateWorkflowSchema = createWorkflowSchema.partial();

export const createStepSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: workflowStepTypeSchema,
  configuration: z.record(z.string(), z.unknown()).default({}),
  position: z.number().int().min(1),
  nextStepId: z.string().optional().nullable(),
});

export const updateStepSchema = createStepSchema.partial();

export type CreateWorkflowBody = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowBody = z.infer<typeof updateWorkflowSchema>;
export type CreateStepBody = z.infer<typeof createStepSchema>;
export type UpdateStepBody = z.infer<typeof updateStepSchema>;
