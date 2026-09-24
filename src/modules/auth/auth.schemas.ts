import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email();
const nameSchema = z.string().trim().min(2).max(120);
const passwordSchema = z.string().min(10).max(128);

export const registerSchema = z.object({
  organizationName: nameSchema,
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export const logoutSchema = refreshSchema;

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type RefreshBody = z.infer<typeof refreshSchema>;
export type LogoutBody = z.infer<typeof logoutSchema>;

export const authJsonSchemas = {
  registerBody: {
    type: 'object',
    required: ['organizationName', 'name', 'email', 'password'],
    properties: {
      organizationName: { type: 'string', minLength: 2, maxLength: 120 },
      name: { type: 'string', minLength: 2, maxLength: 120 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 10, maxLength: 128 },
    },
    additionalProperties: false,
  },
  loginBody: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 1, maxLength: 128 },
    },
    additionalProperties: false,
  },
  refreshBody: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string', minLength: 20 },
    },
    additionalProperties: false,
  },
  authResponse: {
    type: 'object',
    required: ['accessToken', 'refreshToken', 'user'],
    properties: {
      accessToken: { type: 'string' },
      refreshToken: { type: 'string' },
      user: { $ref: 'PublicUser#' },
    },
  },
};
