# FlowPilot Study Guide

Use this as the index for deeper study.

## Concepts

### Modular Monolith
O que é: one deployable application split into clear modules. Por que existe: evolve quickly without distributed-system cost. Onde usamos: `src/modules`. Decisão tomada: monolith first. Alternativas: microservices. Trade-off: simpler deploy, less independent scaling. Interview: why not microservices? Resposta: boundaries are not stable yet.

### Fastify
O que é: Node.js web framework. Por que existe: fast routing, plugins, Pino logs. Onde usamos: API. Decisão: Fastify over Express/Nest. Trade-off: less batteries than Nest, more structure than Express.

### TypeScript
O que é: typed JavaScript. Por que existe: safer refactors. Onde usamos: entire backend. Trade-off: compile step for stronger contracts.

### Prisma
O que é: ORM and migration tool. Por que existe: typed database access. Onde usamos: PostgreSQL models. Trade-off: complex queries may need raw SQL.

### PostgreSQL
O que é: relational database. Por que existe: durable source of truth. Onde usamos: users, workflows, executions, tasks, audit. Trade-off: schema discipline required.

### Redis
O que é: in-memory data store. Por que existe: queue backend. Onde usamos: BullMQ. Decisão: no premature cache. Trade-off: simpler consistency.

### BullMQ, Queue, Worker, Job
O que é: asynchronous job processing. Por que existe: workflow execution can be slow. Onde usamos: `workflow-executions`. Trade-off: needs Redis and idempotency.

### Retry and Backoff
O que é: repeat transient failures with delay. Onde usamos: BullMQ and HTTP step. Trade-off: can duplicate side effects without safeguards.

### Idempotency
O que é: same request key returns same execution. Onde usamos: `Idempotency-Key`. Trade-off: needs persisted uniqueness.

### JWT, Refresh Token, Rotation
O que é: access token for requests, refresh token for session renewal. Onde usamos: auth module. Trade-off: no blacklist yet; short access tokens reduce exposure.

### RBAC
O que é: authorization by role. Onde usamos: ADMIN, MANAGER, MEMBER. Trade-off: simple but less flexible than permissions.

### Multi-tenancy
O que é: isolate organization data. Onde usamos: organization-scoped queries. Key risk: cross-tenant access.

### Transaction
O que é: all-or-nothing database operation. Onde usamos: organization + admin creation. Trade-off: locks/coordination for consistency.

### REST, OpenAPI, API Versioning
O que é: HTTP resources with documented contracts. Onde usamos: `/api/v1`, Swagger. Trade-off: contracts must stay current.

### Workflow Engine and Branching
O que é: executes ordered/branched steps. Onde usamos: execution engine. Decisão: `nextStepId` + CONDITION DSL. Trade-off: simple, not a full graph engine.

### DSL
O que é: small safe language for conditions. Onde usamos: equals, contains, exists. Trade-off: safer than eval, less expressive.

### HTTP Integration and SSRF
O que é: workflow calls external HTTP. Risk: server-side request forgery. Mitigation: safe client blocks local/private targets.

### AI Provider and Structured Output
O que é: internal contract for AI. Onde usamos: `AIProvider`. Trade-off: mock is deterministic; real provider is future.

### Logs, RequestId, Correlation
O que é: structured events linked by IDs. Onde usamos: Pino logs and request IDs. Trade-off: avoid sensitive payloads.

### Metrics and Tracing
O que é: quantitative signals and request spans. Onde usamos: `/metrics`, OpenTelemetry base. Trade-off: no external collector by default.

### Healthcheck and Readiness
O que é: liveness vs dependency readiness. Onde usamos: `/health` and `/ready`.

### Docker
O que é: reproducible runtime. Onde usamos: api, worker, postgres, redis.

### CI and CD
O que é: automated checks and future deployment path. Onde usamos: GitHub Actions for checks. CD is documented roadmap, not configured.

### Tests and Coverage
O que é: unit/integration checks and coverage reporting. Trade-off: 100% coverage does not prove correctness.

### OWASP, Least Privilege, Secrets
O que é: security review mindset. Onde usamos: redaction, RBAC, non-root container, `.env.example`.

### ADRs and Trade-offs
O que é: decision records. Onde usamos: `docs/adr`. Interview answer: mature systems document why choices were made.

### Indexes and Cache
O que é: database performance and read optimization. Onde usamos: indexes in Prisma schema. Cache decision: not adopted yet because consistency is more valuable now.
