import { z } from 'zod';

export const createExecutionSchema = z.object({
  input: z.record(z.string(), z.unknown()).default({}),
});

export const executionQuerySchema = z.object({
  workflowId: z.string().optional(),
  status: z.enum(['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type CreateExecutionBody = z.infer<typeof createExecutionSchema>;
