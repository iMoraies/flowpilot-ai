import { describe, expect, it } from 'vitest';
import { buildTestApp, testEnv } from '../helpers/test-app';
import { issueAccessToken, verifyAccessToken } from '../../src/modules/auth/access-token';
import { generateRefreshToken, hashRefreshToken } from '../../src/modules/auth/refresh-token';

describe('tokens', () => {
  it('generates and validates access tokens', async () => {
    const { app } = await buildTestApp();
    const accessToken = await issueAccessToken(app, testEnv, {
      userId: 'user_1',
      organizationId: 'org_1',
      role: 'ADMIN',
    });

    const payload = await verifyAccessToken(app, accessToken);

    expect(payload).toEqual({
      userId: 'user_1',
      organizationId: 'org_1',
      role: 'ADMIN',
    });

    await app.close();
  });

  it('hashes refresh tokens without keeping the raw value', () => {
    const refreshToken = generateRefreshToken();
    const hash = hashRefreshToken(refreshToken);

    expect(hash).not.toBe(refreshToken);
    expect(hash).toHaveLength(64);
  });
});
