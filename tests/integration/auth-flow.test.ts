import { describe, expect, it } from 'vitest';
import { hashRefreshToken } from '../../src/modules/auth/refresh-token';
import { buildTestApp } from '../helpers/test-app';

async function registerOrganization(app: Awaited<ReturnType<typeof buildTestApp>>['app'], suffix: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      organizationName: `Organization ${suffix}`,
      name: `Admin ${suffix}`,
      email: `admin-${suffix}@example.com`,
      password: 'valid-password',
    },
  });

  expect(response.statusCode).toBe(201);
  return response.json<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; organizationId: string; email: string; role: string };
    organization: { id: string; name: string };
  }>();
}

describe('auth flow', () => {
  it('registers an organization and first ADMIN in one flow', async () => {
    const { app } = await buildTestApp();
    const body = await registerOrganization(app, 'register');

    expect(body.organization.name).toBe('Organization register');
    expect(body.user.role).toBe('ADMIN');
    expect(body.user.organizationId).toBe(body.organization.id);
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();

    await app.close();
  });

  it('logs in with valid credentials', async () => {
    const { app } = await buildTestApp();
    const registered = await registerOrganization(app, 'login');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: registered.user.email,
        password: 'valid-password',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<{ user: { email: string }; accessToken: string }>().user.email).toBe(
      registered.user.email,
    );
    expect(response.json<{ accessToken: string }>().accessToken).toBeTruthy();

    await app.close();
  });

  it('rejects invalid login without revealing whether the email exists', async () => {
    const { app } = await buildTestApp();
    await registerOrganization(app, 'invalid-login');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'admin-invalid-login@example.com',
        password: 'wrong-password',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json<{ error: { code: string; message: string } }>().error).toMatchObject({
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });

    await app.close();
  });

  it('rotates refresh tokens', async () => {
    const { app, repository } = await buildTestApp();
    const registered = await registerOrganization(app, 'refresh');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {
        refreshToken: registered.refreshToken,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ refreshToken: string; accessToken: string }>();
    expect(body.refreshToken).not.toBe(registered.refreshToken);
    expect(body.accessToken).toBeTruthy();

    const oldToken = repository.refreshTokens.get(hashRefreshToken(registered.refreshToken));
    expect(oldToken?.revokedAt).toBeInstanceOf(Date);

    await app.close();
  });

  it('rejects a revoked refresh token', async () => {
    const { app } = await buildTestApp();
    const registered = await registerOrganization(app, 'revoked-refresh');

    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {
        refreshToken: registered.refreshToken,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {
        refreshToken: registered.refreshToken,
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json<{ error: { code: string } }>().error.code).toBe('AUTH_REFRESH_REVOKED');

    await app.close();
  });

  it('logs out by revoking the refresh token', async () => {
    const { app } = await buildTestApp();
    const registered = await registerOrganization(app, 'logout');

    const logout = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: {
        authorization: `Bearer ${registered.accessToken}`,
      },
      payload: {
        refreshToken: registered.refreshToken,
      },
    });

    expect(logout.statusCode).toBe(204);

    const refresh = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {
        refreshToken: registered.refreshToken,
      },
    });

    expect(refresh.statusCode).toBe(401);
    expect(refresh.json<{ error: { code: string } }>().error.code).toBe('AUTH_REFRESH_REVOKED');

    await app.close();
  });

  it('returns the authenticated user from /auth/me', async () => {
    const { app } = await buildTestApp();
    const registered = await registerOrganization(app, 'me');

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${registered.accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<{ id: string; email: string; passwordHash?: string }>().id).toBe(
      registered.user.id,
    );
    expect(response.json<{ passwordHash?: string }>().passwordHash).toBeUndefined();

    await app.close();
  });
});
