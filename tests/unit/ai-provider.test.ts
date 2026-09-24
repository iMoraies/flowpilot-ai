import { describe, expect, it } from 'vitest';
import { MockAIProvider } from '../../src/infrastructure/ai/ai-provider';

describe('MockAIProvider', () => {
  it('returns a category from the allowed list', async () => {
    const provider = new MockAIProvider();
    const result = await provider.classify({
      text: 'Customer has a TECHNICAL issue',
      categories: ['TECHNICAL', 'BILLING', 'GENERAL'],
    });

    expect(result.category).toBe('TECHNICAL');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('fails when no categories are provided', async () => {
    const provider = new MockAIProvider();
    await expect(provider.classify({ text: 'hello', categories: [] })).rejects.toThrow('at least one category');
  });
});
