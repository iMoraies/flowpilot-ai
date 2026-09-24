# ADR 0008: Workflow Versioning

## Context

Active workflow definitions should not change the meaning of executions already created.

## Decision

Store `workflowVersion` and `workflowSnapshot` on every execution. Editing a workflow increments its version and returns it to `DRAFT`.

## Alternatives Considered

- Separate workflow version tables: stronger history model but heavier for this stage.
- Mutate active workflows directly: rejected because old executions would become ambiguous.

## Consequences

Execution history is stable and simple to query. The trade-off is some JSON duplication per execution.
