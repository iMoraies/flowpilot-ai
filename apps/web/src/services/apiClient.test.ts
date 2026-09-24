import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from './apiClient';
import { setTokens } from './tokenStore';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('apiRequest', () => {
  it('refreshes the session after a 401 and retries once', async () => {
    setTokens({ accessToken: 'expired-access', refreshToken: 'valid-refresh' });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ error: { message: 'expired' } }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        user: { id: 'u1', organizationId: 'o1', name: 'Admin', email: 'admin@flowpilot.local', role: 'ADMIN', createdAt: '', updatedAt: '' },
        organization: { id: 'o1', name: 'FlowPilot', createdAt: '', updatedAt: '' },
      }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest<{ ok: boolean }>('/workflows')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][1]?.headers?.get('Authorization')).toBe('Bearer new-access');
  });
});
