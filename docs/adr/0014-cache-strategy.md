# ADR 0014: Cache Strategy

## Context

Redis is available, but caching workflow definitions prematurely can create consistency bugs.

## Decision

Do not add runtime cache yet. Redis is used for BullMQ. Workflow definitions are read from PostgreSQL and snapshotted at execution creation.

## Alternatives Considered

- Cache active workflows with TTL: useful later, but invalidation on edits/activation adds complexity now.
- Cache everything aggressively: rejected as artificial complexity.

## Consequences

The system is simpler and strongly consistent. If read pressure appears, active workflow definitions can be cached with explicit invalidation.
