# ADR 0011: HTTP Integration Security

## Context

HTTP workflow steps can accidentally become SSRF primitives.

## Decision

Centralize HTTP calls in a safe client that validates protocol, blocks localhost/private IPv4/local IPv6 targets, strips sensitive headers, limits timeout, and caps response body size.

## Alternatives Considered

- Raw `fetch` in steps: rejected because protections would be inconsistent.
- Full egress proxy: stronger but outside this local portfolio scope.

## Consequences

The implementation reduces common SSRF risk. DNS rebinding and advanced network controls remain residual risks for production hardening.
