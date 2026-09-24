import type { UserRole } from '@prisma/client';

export type AuthenticatedUser = {
  userId: string;
  organizationId: string;
  role: UserRole;
};

export type PublicUser = {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicOrganization = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserWithPassword = PublicUser & {
  passwordHash: string;
};

export type StoredRefreshToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  user: UserWithPassword;
};

export type RegisterInput = {
  organizationName: string;
  name: string;
  email: string;
  passwordHash: string;
};

export type CreateUserInput = {
  organizationId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Exclude<UserRole, 'ADMIN'>;
};

export type SecurityEvent =
  | 'login success'
  | 'login failure'
  | 'refresh'
  | 'logout'
  | 'user created'
  | 'role changed';
