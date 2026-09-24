import type { UserRole } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error';
import type { AuthRepository } from '../auth/auth.repository';
import type { AuthenticatedUser, PublicUser } from '../auth/auth.types';
import { hashPassword } from '../auth/password';
import { isUniqueConstraintError } from '../auth/prisma-auth.repository';
import type { CreateUserBody, UpdateUserRoleBody } from './users.schemas';

export class UsersService {
  public constructor(private readonly repository: AuthRepository) {}

  public listUsers(auth: AuthenticatedUser): Promise<PublicUser[]> {
    return this.repository.listUsersByOrganization(auth.organizationId);
  }

  public async createUser(auth: AuthenticatedUser, input: CreateUserBody): Promise<PublicUser> {
    try {
      return await this.repository.createUser({
        organizationId: auth.organizationId,
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: input.role,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AppError('USER_EMAIL_ALREADY_EXISTS', 'Email already exists', 409);
      }

      throw error;
    }
  }

  public async updateRole(
    auth: AuthenticatedUser,
    userId: string,
    input: UpdateUserRoleBody,
  ): Promise<PublicUser> {
    const targetUser = await this.repository.findUserByIdInOrganization(userId, auth.organizationId);

    if (!targetUser) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    await this.assertRoleChangeIsSafe(auth, targetUser, input.role);

    return this.repository.updateUserRole(userId, auth.organizationId, input.role);
  }

  private async assertRoleChangeIsSafe(
    auth: AuthenticatedUser,
    targetUser: PublicUser,
    nextRole: UserRole,
  ): Promise<void> {
    if (auth.userId !== targetUser.id || targetUser.role !== 'ADMIN' || nextRole === 'ADMIN') {
      return;
    }

    const adminCount = await this.repository.countAdminsInOrganization(auth.organizationId);

    if (adminCount <= 1) {
      throw new AppError(
        'AUTH_FORBIDDEN',
        'Cannot remove the last administrator from the organization',
        403,
      );
    }
  }
}
