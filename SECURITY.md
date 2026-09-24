# Security

## Authentication Model

FlowPilot AI uses short-lived JWT access tokens and persisted refresh tokens. Access tokens carry only minimal claims: `sub`, `organizationId`, and `role`.

## Password Hashing

Passwords are never stored or returned in plain text. They are hashed with Argon2id before persistence. The current minimum password length is 10 characters, which keeps the rule usable while blocking very weak passwords.

## Refresh Tokens

Refresh tokens are generated with high entropy and stored only as SHA-256 hashes. On successful refresh, the old token is revoked and a new refresh token is issued.

For this API-only phase, refresh tokens are returned in the response body. For browser applications, the preferred approach is to store them in secure, HttpOnly, SameSite cookies.

## RBAC

Initial roles are:

- `ADMIN`: organization administration and user management.
- `MANAGER`: can list organization users.
- `MEMBER`: regular authenticated user.

No granular permission system exists yet.

## Multi-Tenancy

Every authenticated request derives `organizationId` from the access token. Client-provided `organizationId` values are not trusted for protected resources. User management queries always filter by the authenticated organization.

## Secrets

Secrets must come from environment variables and must not be committed. `.env.example` contains placeholders only.

## Logging

Logs use structured Pino-compatible output. Passwords, tokens, secrets, cookies, and authorization headers are redacted. Security events such as login success/failure, refresh, logout, user creation, and role changes are logged without token or password values.

## Rate Limiting

Authentication-sensitive endpoints use route-level rate limiting. The default is 20 requests per minute for login, register, and refresh, which is permissive for development while limiting simple brute-force attempts.

## Known Residual Risks

- No MFA, OAuth, SSO, or API keys yet.
- No access-token blacklist; logout revokes refresh tokens only.
- Rate limiting is basic and should be backed by Redis before multiple API instances are used.
- Refresh token replay detection is limited to rejecting already revoked tokens.
- Audit logs are structured application logs for now, not a durable audit table.
