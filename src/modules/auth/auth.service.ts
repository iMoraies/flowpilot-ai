import type { FastifyInstance } from 'fastify';
import type { Env } from '../../config/env';
import { AppError } from '../../shared/errors/app-error';
import { issueAccessToken } from './access-token';
import type { AuthRepository } from './auth.repository';
import type { PublicOrganization, PublicUser } from './auth.types';
import { generateRefreshToken, getRefreshTokenExpiration, hashRefreshToken } from './refresh-token';
import { hashPassword, verifyPassword } from './password';
import type { LoginBody, RegisterBody } from './auth.schemas';
import { isUniqueConstraintError } from './prisma-auth.repository';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthResponse = AuthTokens & {
  user: PublicUser;
};

type RegisterResponse = AuthResponse & {
  organization: PublicOrganization;
};

export class AuthService {
  public constructor(
    private readonly repository: AuthRepository,
    private readonly app: FastifyInstance,
    private readonly env: Env,
  ) {}

  public async register(input: RegisterBody): Promise<RegisterResponse> {
    const passwordHash = await hashPassword(input.password);

    try {
      const registered = await this.repository.createOrganizationWithAdmin({
        organizationName: input.organizationName,
        name: input.name,
        email: input.email,
        passwordHash,
      });

      const tokens = await this.issueTokens(registered.user);

      return {
        ...tokens,
        user: registered.user,
        organization: registered.organization,
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AppError('USER_EMAIL_ALREADY_EXISTS', 'Email already exists', 409);
      }

      throw error;
    }
  }

  public async login(input: LoginBody): Promise<AuthResponse> {
    const user = await this.repository.findUserByEmail(input.email);

    if (!user) {
      throw new AppError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const passwordMatches = await verifyPassword(user.passwordHash, input.password);

    if (!passwordMatches) {
      throw new AppError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const tokens = await this.issueTokens(user);

    return {
      ...tokens,
      user: this.toPublicUser(user),
    };
  }

  public async refresh(refreshToken: string): Promise<AuthResponse> {
    const tokenHash = hashRefreshToken(refreshToken);
    const storedToken = await this.repository.findRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw new AppError('AUTH_TOKEN_INVALID', 'Invalid refresh token', 401);
    }

    if (storedToken.revokedAt) {
      throw new AppError('AUTH_REFRESH_REVOKED', 'Refresh token has been revoked', 401);
    }

    if (storedToken.expiresAt.getTime() <= Date.now()) {
      throw new AppError('AUTH_TOKEN_EXPIRED', 'Refresh token has expired', 401);
    }

    const nextRefreshToken = generateRefreshToken();
    const nextRefreshTokenHash = hashRefreshToken(nextRefreshToken);

    await this.repository.rotateRefreshToken(storedToken.id, {
      userId: storedToken.userId,
      tokenHash: nextRefreshTokenHash,
      expiresAt: getRefreshTokenExpiration(this.env.REFRESH_TOKEN_TTL_DAYS),
    });

    const accessToken = await issueAccessToken(this.app, this.env, {
      userId: storedToken.user.id,
      organizationId: storedToken.user.organizationId,
      role: storedToken.user.role,
    });

    return {
      accessToken,
      refreshToken: nextRefreshToken,
      user: this.toPublicUser(storedToken.user),
    };
  }

  public async logout(refreshToken: string): Promise<void> {
    await this.repository.revokeRefreshToken(hashRefreshToken(refreshToken));
  }

  public async getMe(userId: string): Promise<PublicUser> {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    return user;
  }

  private async issueTokens(user: PublicUser): Promise<AuthTokens> {
    const refreshToken = generateRefreshToken();

    await this.repository.createRefreshToken({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiration(this.env.REFRESH_TOKEN_TTL_DAYS),
    });

    const accessToken = await issueAccessToken(this.app, this.env, {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private toPublicUser(user: PublicUser): PublicUser {
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
}
