import type { UserRole } from '@prisma/client';
import type {
  CreateUserInput,
  PublicOrganization,
  PublicUser,
  RegisterInput,
  StoredRefreshToken,
  UserWithPassword,
} from './auth.types';

export type RegisteredOrganizationAdmin = {
  organization: PublicOrganization;
  user: PublicUser;
};

export type RefreshTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export interface AuthRepository {
  createOrganizationWithAdmin(input: RegisterInput): Promise<RegisteredOrganizationAdmin>;
  findUserByEmail(email: string): Promise<UserWithPassword | null>;
  findUserById(userId: string): Promise<PublicUser | null>;
  findRefreshTokenByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  createRefreshToken(input: RefreshTokenInput): Promise<void>;
  rotateRefreshToken(oldTokenId: string, nextToken: RefreshTokenInput): Promise<void>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  listUsersByOrganization(organizationId: string): Promise<PublicUser[]>;
  createUser(input: CreateUserInput): Promise<PublicUser>;
  findUserByIdInOrganization(userId: string, organizationId: string): Promise<PublicUser | null>;
  countAdminsInOrganization(organizationId: string): Promise<number>;
  updateUserRole(userId: string, organizationId: string, role: UserRole): Promise<PublicUser>;
}
