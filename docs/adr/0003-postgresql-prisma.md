# ADR 0003: PostgreSQL with Prisma

## Context

FlowPilot AI needs relational data from the start: organizations own users, users will own sessions, and future workflow definitions will relate to executions, steps, tasks, integrations, and audit logs.

The project should also keep database changes explicit and reviewable.

## Decision

Use PostgreSQL as the primary database and Prisma as the ORM/migration tool. The initial schema includes only infrastructure needed now: `Organization`, `User`, and `RefreshToken`.

## Alternatives Considered

- MongoDB: rejected because the core data has important relationships and future consistency needs.
- Raw SQL only: powerful, but slower for this stage and more repetitive for common CRUD work.
- TypeORM or MikroORM: valid options, but Prisma provides a strong schema-first workflow, generated client, and clear migration flow.

## Consequences

PostgreSQL gives durable relational modeling and strong constraints. Prisma improves type safety and makes migrations visible. The trade-off is that complex queries may sometimes need raw SQL later, and the team must keep Prisma migrations disciplined instead of editing production data by hand.
