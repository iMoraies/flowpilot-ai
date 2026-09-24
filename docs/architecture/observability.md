# Observability

The project exposes structured logs, Prometheus-style metrics, request IDs, and a minimal OpenTelemetry tracer provider.

Metrics include:

- HTTP request count.
- HTTP request duration.
- Workflow execution counters.
- Workflow failure counters.

Tracing is initialized locally and can be connected to an OpenTelemetry Collector later by adding an exporter. The current implementation focuses on clean instrumentation boundaries without requiring external infrastructure.
