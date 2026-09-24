import { z } from 'zod';

export const updateTaskSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  assignedTo: z.string().nullable().optional(),
});

export const taskQuerySchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
});

export type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
