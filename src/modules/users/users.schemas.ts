import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email();
const nameSchema = z.string().trim().min(2).max(120);
const passwordSchema = z.string().min(10).max(128);

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['MANAGER', 'MEMBER']),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']),
});

export type CreateUserBody = z.infer<typeof createUserSchema>;
export type UpdateUserRoleBody = z.infer<typeof updateUserRoleSchema>;

export const usersJsonSchemas = {
  createUserBody: {
    type: 'object',
    required: ['name', 'email', 'password', 'role'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 120 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 10, maxLength: 128 },
      role: { type: 'string', enum: ['MANAGER', 'MEMBER'] },
    },
    additionalProperties: false,
  },
  updateUserRoleBody: {
    type: 'object',
    required: ['role'],
    properties: {
      role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'MEMBER'] },
    },
    additionalProperties: false,
  },
};
