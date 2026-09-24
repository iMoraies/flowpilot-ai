import { describe, expect, it } from 'vitest';
import { validateSafeUrl } from '../../src/infrastructure/http/safe-http-client';

describe('safe HTTP client URL validation', () => {
  it('allows public HTTP and HTTPS URLs', () => {
    expect(validateSafeUrl('https://example.com/webhook').hostname).toBe('example.com');
  });

  it('blocks unsupported protocols and local/private targets', () => {
    expect(() => validateSafeUrl('file:///etc/passwd')).toThrow('Only HTTP and HTTPS');
    expect(() => validateSafeUrl('http://localhost:3000')).toThrow('Private or local');
    expect(() => validateSafeUrl('http://127.0.0.1:3000')).toThrow('Private or local');
    expect(() => validateSafeUrl('http://192.168.1.10')).toThrow('Private or local');
  });
});
