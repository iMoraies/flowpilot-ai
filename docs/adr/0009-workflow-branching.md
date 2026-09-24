# ADR 0009: Workflow Branching

## Context

Workflows need branches without a complex graph engine.

## Decision

Use `nextStepId` for simple transitions and a safe `CONDITION` DSL with `onTrue` and `onFalse`.

## Alternatives Considered

- Full graph engine: too complex for the first production-shaped version.
- Linear-only steps: rejected because conditions are a core requirement.

## Consequences

Branching is explainable and testable. The trade-off is limited graph expressiveness.
