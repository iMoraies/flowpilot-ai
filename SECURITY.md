# Security

## Authentication Model

FlowPilot AI uses short-lived JWT access tokens and persisted refresh tokens. Access token claims are minimal: `sub`, `organizationId`, and `role`.

## Password Hashing

Passwords are hashed with Argon2id. Passwords and password hashes are never returned by the API.

## Refresh Tokens

Refresh tokens are generated with high entropy and stored only as SHA-256 hashes. Refresh token rotation revokes the old token whenever a new one is issued.

For this API-only project, refresh tokens are returned in the response body. A browser production app should prefer Secure, HttpOnly, SameSite cookies.

## RBAC

Roles:

- `ADMIN`: full organization administration.
- `MANAGER`: workflow and user visibility/management.
- `MEMBER`: view and execute workflows.

## Multi-Tenancy

Protected queries derive `organizationId` from the authenticated token. Client-provided organization IDs are not trusted.

## HTTP Integration Security

HTTP steps use a centralized safe client. It allows only HTTP/HTTPS, applies timeouts, limits response size, strips sensitive outbound headers, and blocks localhost/private network targets.

Residual SSRF risks remain around DNS rebinding and infrastructure-specific metadata endpoints. Production deployments should enforce egress network policy.

## Secrets

Secrets are environment variables. `.env.example` contains placeholders only. Integrations currently accept non-sensitive configuration only; secret manager support is future roadmap.

## Logging

Authorization headers, cookies, passwords, tokens, and obvious secrets are redacted. Payloads are not logged indiscriminately.

## Rate Limiting

Login, register, and refresh have route-level rate limiting. For multi-instance deployments, rate limiting should use a shared Redis backend.

## Threat Model

### Assets

- User identities and password hashes.
- Refresh token hashes.
- Organization data.
- Workflow definitions and execution results.
- Audit logs.

### Attack Surfaces

- Public REST API.
- Authentication endpoints.
- Workflow HTTP integration step.
- Worker job processing.
- Swagger and metrics endpoints.

### Trust Boundaries

- Client to API.
- API/worker to PostgreSQL.
- API/worker to Redis.
- Worker to external HTTP targets.
- Workflow engine to AI provider.

### Key Threats

- Brute force login attempts.
- User enumeration.
- Refresh token theft or replay.
- Broken access control across tenants.
- SSRF through HTTP steps.
- Sensitive data exposure through logs.
- Dependency vulnerabilities.
- Privilege escalation through role changes.

### Mitigations

- Argon2id password hashing.
- Generic login failure response.
- Refresh token hashing and rotation.
- RBAC guards.
- Organization-scoped queries.
- Safe HTTP client and URL validation.
- Structured log redaction.
- npm audit in CI.
- Last-admin protection.

### Residual Risks

- No MFA yet.
- No access token blacklist.
- No production-grade secret manager.
- No full egress firewall in Docker Compose.
- Audit events are stored but do not yet include tamper-proof retention.

## Least Privilege

The app uses scoped roles, avoids committing secrets, runs Docker runtime as a non-root user, and protects administrative endpoints with RBAC.
