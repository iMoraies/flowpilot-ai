import { Prisma, type PrismaClient, type UserRole } from '@prisma/client';
import type {
  AuthRepository,
  RefreshTokenInput,
  RegisteredOrganizationAdmin,
} from './auth.repository';
import type {
  CreateUserInput,
  PublicUser,
  RegisterInput,
  StoredRefreshToken,
  UserWithPassword,
} from './auth.types';

const publicUserSelect = {
  id: true,
  organizationId: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const userWithPasswordSelect = {
  ...publicUserSelect,
  passwordHash: true,
} satisfies Prisma.UserSelect;

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') ||
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002')
  );
}

export class PrismaAuthRepository implements AuthRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async createOrganizationWithAdmin(
    input: RegisterInput,
  ): Promise<RegisteredOrganizationAdmin> {
    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.organizationName,
        },
      });

      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          name: input.name,
          email: input.email,
          passwordHash: input.passwordHash,
          role: 'ADMIN',
        },
        select: publicUserSelect,
      });

      return {
        organization,
        user,
      };
    });
  }

  public async findUserByEmail(email: string): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: userWithPasswordSelect,
    });
  }

  public async findUserById(userId: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });
  }

  public async findRefreshTokenByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: userWithPasswordSelect,
        },
      },
    });
  }

  public async createRefreshToken(input: RefreshTokenInput): Promise<void> {
    await this.prisma.refreshToken.create({
      data: input,
    });
  }

  public async rotateRefreshToken(
    oldTokenId: string,
    nextToken: RefreshTokenInput,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: oldTokenId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: nextToken,
      }),
    ]);
  }

  public async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  public async listUsersByOrganization(organizationId: string): Promise<PublicUser[]> {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: publicUserSelect,
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  public async createUser(input: CreateUserInput): Promise<PublicUser> {
    return this.prisma.user.create({
      data: input,
      select: publicUserSelect,
    });
  }

  public async findUserByIdInOrganization(
    userId: string,
    organizationId: string,
  ): Promise<PublicUser | null> {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
      select: publicUserSelect,
    });
  }

  public async countAdminsInOrganization(organizationId: string): Promise<number> {
    return this.prisma.user.count({
      where: {
        organizationId,
        role: 'ADMIN',
      },
    });
  }

  public async updateUserRole(
    userId: string,
    organizationId: string,
    role: UserRole,
  ): Promise<PublicUser> {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        organizationId,
      },
      data: {
        role,
      },
    });

    const user = await this.findUserByIdInOrganization(userId, organizationId);

    if (!user) {
      throw new Error('User not found after role update');
    }

    return user;
  }
}
