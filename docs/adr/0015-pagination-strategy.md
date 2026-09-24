# ADR 0015: Pagination Strategy

## Context

List endpoints need predictable limits.

## Decision

Use offset/limit pagination with max limit 100.

## Alternatives Considered

- Cursor pagination: better for very large lists, but more complex.
- No pagination: rejected because audit logs and executions can grow quickly.

## Consequences

Offset pagination is simple for demos and admin screens. The trade-off is weaker performance on very large offsets.
