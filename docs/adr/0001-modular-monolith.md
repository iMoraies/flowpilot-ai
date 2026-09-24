# ADR 0001: Modular Monolith

## Context

FlowPilot AI is starting as a portfolio project that should still resemble a system that could grow into production. The domain is not stable yet: workflow definitions, execution rules, conditions, integrations, and AI steps will evolve as the project matures.

Splitting the system into microservices now would add deployment, networking, distributed tracing, data ownership, and contract-versioning costs before the boundaries are proven.

## Decision

Start with a modular monolith. The application is deployed as one backend, but code is organized by clear internal areas: modules, shared utilities, infrastructure, config, and jobs.

## Alternatives Considered

- Microservices from the beginning: rejected because the operational cost is high and the domain boundaries are still changing.
- Single flat application structure: rejected because it would make future module ownership and extraction harder.
- Full DDD layering from day one: rejected because it would add ceremony before the behavior justifies it.

## Consequences

The project can move quickly, test locally with less friction, and keep transactional consistency simple. The trade-off is that modules do not have independent deployments. If a future module becomes operationally independent, it can be extracted after its boundary is proven by real usage.
