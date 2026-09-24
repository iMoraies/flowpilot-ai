import { z } from 'zod';

export const createIntegrationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.enum(['HTTP', 'NOTIFICATION', 'AI']),
  configuration: z.record(z.string(), z.unknown()).default({}),
});

export const updateIntegrationSchema = createIntegrationSchema.partial();

export type CreateIntegrationBody = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationBody = z.infer<typeof updateIntegrationSchema>;
