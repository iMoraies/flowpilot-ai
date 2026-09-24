# Architecture Overview

FlowPilot AI is a modular monolith for multi-tenant workflow automation.

```mermaid
flowchart LR
  Client[API client] --> API[Fastify API]
  API --> PG[(PostgreSQL)]
  API --> Redis[(Redis)]
  API --> Queue[BullMQ queue]
  Queue --> Worker[Workflow worker]
  Worker --> PG
  Worker --> AI[AIProvider]
  Worker --> HTTP[Safe HTTP client]
  Worker --> Notify[NotificationProvider]
```

The API owns authentication, RBAC, REST endpoints, validation, and enqueueing. The worker owns asynchronous execution. PostgreSQL is the source of truth. Redis backs BullMQ and is not the source of truth for idempotency.

## API Versioning

All product endpoints live under `/api/v1`. Operational endpoints are `/health`, `/ready`, `/metrics`, and `/docs`.
