# ADR 0012: AI Provider Abstraction

## Context

The workflow engine should not be coupled to a specific AI vendor.

## Decision

Use an internal `AIProvider` contract with `classify`, `generate`, and `summarize`. Development defaults to `MockAIProvider`.

## Alternatives Considered

- Direct OpenAI calls in the engine: rejected because it couples domain behavior to one provider.
- No AI abstraction: rejected because AI classification is a core workflow step.

## Consequences

Tests are deterministic and no API key is required. A real provider can be added later behind the same contract.
