# ADR 0010: Idempotency

## Context

Clients may retry execution creation after network failures. Retries must not create duplicate workflow runs.

## Decision

Accept `Idempotency-Key` on execution creation and persist uniqueness by organization, workflow, and key in PostgreSQL.

## Alternatives Considered

- Redis-only idempotency: rejected because Redis should not be the source of truth.
- No idempotency: rejected because retries would create duplicate work.

## Consequences

Duplicate requests can return the existing execution. The trade-off is that idempotency is scoped only to workflow execution creation for now.
