# ADR 0004: Authentication Strategy

## Context

FlowPilot AI needs an authentication model that works for an API-first backend, supports future front-ends, and keeps user identity tied to an organization and role.

## Decision

Use email and password authentication with Argon2id password hashing, short-lived JWT access tokens, and persisted refresh tokens. The access token includes only `sub`, `organizationId`, and `role`.

## Alternatives Considered

- OAuth/SSO now: rejected because it adds provider setup and user lifecycle complexity before the core product exists.
- Stateful server sessions only: valid for browser apps, but less convenient for API clients and tests at this stage.
- Long-lived JWT only: rejected because stolen tokens would remain usable for too long.

## Consequences

The API remains simple to consume and easy to test. The trade-off is that token storage strategy must be revisited when a real browser front-end appears, ideally using HttpOnly cookies for refresh tokens.
