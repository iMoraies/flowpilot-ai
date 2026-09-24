# ADR 0005: Refresh Token Rotation

## Context

Refresh tokens live longer than access tokens. If a refresh token is stolen and remains valid until expiration, an attacker can keep creating access tokens.

## Decision

Store only refresh token hashes. On every successful refresh, revoke the old refresh token and issue a new one.

## Alternatives Considered

- Reuse the same refresh token until expiration: simpler, but weaker if the token leaks.
- Store refresh tokens in plain text: rejected because a database leak would expose active credentials.
- Blacklist all access tokens on logout: rejected for now because it requires extra lookup infrastructure on every authenticated request.

## Consequences

Rotation limits the useful lifetime of a stolen refresh token after legitimate use. It adds state and requires a database check during refresh, but that is acceptable because refresh happens less often than normal API requests.
