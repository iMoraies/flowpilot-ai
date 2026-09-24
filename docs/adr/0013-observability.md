# ADR 0013: Observability

## Context

The project should demonstrate operational thinking without requiring hosted monitoring.

## Decision

Use structured logs, request IDs, Prometheus-compatible metrics, health/readiness endpoints, and a minimal OpenTelemetry tracing provider.

## Alternatives Considered

- No metrics/tracing: insufficient for a production-shaped backend.
- Full hosted observability stack: too heavy for local development.

## Consequences

The app is easy to inspect locally and can evolve toward a collector/exporter setup later.
