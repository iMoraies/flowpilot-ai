import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/modules/auth/password';

describe('password hashing', () => {
  it('hashes and verifies a valid password with Argon2id', async () => {
    const hash = await hashPassword('valid-password');

    expect(hash).not.toBe('valid-password');
    expect(hash).toContain('argon2id');
    await expect(verifyPassword(hash, 'valid-password')).resolves.toBe(true);
    await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false);
  });

  it('rejects passwords that are too short', async () => {
    await expect(hashPassword('short')).rejects.toThrow('Password must have at least');
  });
});
