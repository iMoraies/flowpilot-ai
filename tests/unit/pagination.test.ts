import { describe, expect, it } from 'vitest';
import { parsePagination, toPaginatedResult } from '../../src/shared/pagination/pagination';

describe('pagination helpers', () => {
  it('parses defaults and caps limit', () => {
    expect(parsePagination({})).toEqual({ limit: 20, offset: 0 });
    expect(() => parsePagination({ limit: 101 })).toThrow();
  });

  it('formats paginated results consistently', () => {
    expect(toPaginatedResult([1, 2], { limit: 2, offset: 0 }, 5)).toEqual({
      data: [1, 2],
      pagination: { limit: 2, offset: 0, total: 5 },
    });
  });
});
