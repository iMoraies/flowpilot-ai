# ADR 0002: Fastify with TypeScript

## Context

The API needs to be small, fast to iterate on, and friendly to validation, structured logging, and OpenAPI documentation. TypeScript is important because the project aims to demonstrate maintainable backend engineering.

## Decision

Use Fastify with TypeScript for the HTTP API. Keep `app.ts` responsible for building the application and `server.ts` responsible for opening the network port.

## Alternatives Considered

- Express: familiar and flexible, but Fastify provides stronger built-in structure for schemas, logging, plugins, and request lifecycle hooks.
- NestJS: productive for larger teams, but too much framework structure for this initial foundation.
- Plain Node HTTP server: too low-level for the goals of validation, documentation, and maintainable routing.

## Consequences

Fastify gives a clean plugin model, Pino-compatible logging, request IDs, and a straightforward testing story through injection. The trade-off is that the team must follow Fastify patterns consistently instead of treating it like Express.
