import type { UserRole } from '@prisma/client';
import type {
  AuthRepository,
  RefreshTokenInput,
  RegisteredOrganizationAdmin,
} from '../../src/modules/auth/auth.repository';
import type {
  CreateUserInput,
  PublicOrganization,
  PublicUser,
  RegisterInput,
  StoredRefreshToken,
  UserWithPassword,
} from '../../src/modules/auth/auth.types';

let idSequence = 0;

function nextId(prefix: string): string {
  idSequence += 1;
  return `${prefix}_${idSequence}`;
}

function now(): Date {
  return new Date();
}

function toPublicUser(user: UserWithPassword): PublicUser {
  return {
    id: user.id,
    organizationId: user.organizationId,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class FakeAuthRepository implements AuthRepository {
  public readonly organizations = new Map<string, PublicOrganization>();
  public readonly users = new Map<string, UserWithPassword>();
  public readonly refreshTokens = new Map<string, StoredRefreshToken>();

  public async createOrganizationWithAdmin(
    input: RegisterInput,
  ): Promise<RegisteredOrganizationAdmin> {
    this.assertEmailIsAvailable(input.email);

    const timestamp = now();
    const organization: PublicOrganization = {
      id: nextId('org'),
      name: input.organizationName,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const user: UserWithPassword = {
      id: nextId('user'),
      organizationId: organization.id,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: 'ADMIN',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.organizations.set(organization.id, organization);
    this.users.set(user.id, user);

    return {
      organization,
      user: toPublicUser(user),
    };
  }

  public async findUserByEmail(email: string): Promise<UserWithPassword | null> {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  public async findUserById(userId: string): Promise<PublicUser | null> {
    const user = this.users.get(userId);
    return user ? toPublicUser(user) : null;
  }

  public async findRefreshTokenByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    return this.refreshTokens.get(tokenHash) ?? null;
  }

  public async createRefreshToken(input: RefreshTokenInput): Promise<void> {
    const user = this.users.get(input.userId);

    if (!user) {
      throw new Error('User not found');
    }

    this.refreshTokens.set(input.tokenHash, {
      id: nextId('refresh'),
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      user,
    });
  }

  public async rotateRefreshToken(
    oldTokenId: string,
    nextToken: RefreshTokenInput,
  ): Promise<void> {
    const oldToken = [...this.refreshTokens.values()].find((token) => token.id === oldTokenId);

    if (!oldToken) {
      throw new Error('Refresh token not found');
    }

    oldToken.revokedAt = now();
    await this.createRefreshToken(nextToken);
  }

  public async revokeRefreshToken(tokenHash: string): Promise<void> {
    const token = this.refreshTokens.get(tokenHash);

    if (token) {
      token.revokedAt = now();
    }
  }

  public async listUsersByOrganization(organizationId: string): Promise<PublicUser[]> {
    return [...this.users.values()]
      .filter((user) => user.organizationId === organizationId)
      .map(toPublicUser);
  }

  public async createUser(input: CreateUserInput): Promise<PublicUser> {
    this.assertEmailIsAvailable(input.email);

    const timestamp = now();
    const user: UserWithPassword = {
      id: nextId('user'),
      organizationId: input.organizationId,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.users.set(user.id, user);
    return toPublicUser(user);
  }

  public async findUserByIdInOrganization(
    userId: string,
    organizationId: string,
  ): Promise<PublicUser | null> {
    const user = this.users.get(userId);
    return user?.organizationId === organizationId ? toPublicUser(user) : null;
  }

  public async countAdminsInOrganization(organizationId: string): Promise<number> {
    return [...this.users.values()].filter(
      (user) => user.organizationId === organizationId && user.role === 'ADMIN',
    ).length;
  }

  public async updateUserRole(
    userId: string,
    organizationId: string,
    role: UserRole,
  ): Promise<PublicUser> {
    const user = this.users.get(userId);

    if (!user || user.organizationId !== organizationId) {
      throw new Error('User not found');
    }

    user.role = role;
    user.updatedAt = now();
    return toPublicUser(user);
  }

  private assertEmailIsAvailable(email: string): void {
    if ([...this.users.values()].some((user) => user.email === email)) {
      const error = new Error('Unique constraint failed') as Error & { code: string };
      error.code = 'P2002';
      throw error;
    }
  }
}
