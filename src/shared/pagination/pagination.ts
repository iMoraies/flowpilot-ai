import { z } from 'zod';

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type Pagination = z.infer<typeof paginationSchema>;

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};

export function parsePagination(query: unknown): Pagination {
  return paginationSchema.parse(query ?? {});
}

export function toPaginatedResult<T>(data: T[], pagination: Pagination, total: number): PaginatedResult<T> {
  return {
    data,
    pagination: {
      limit: pagination.limit,
      offset: pagination.offset,
      total,
    },
  };
}
