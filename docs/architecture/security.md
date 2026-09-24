# Security Architecture

```mermaid
sequenceDiagram
  participant User
  participant API
  participant DB

  User->>API: login(email, password)
  API->>DB: load user by email
  API->>API: verify Argon2id hash
  API->>DB: store refresh token hash
  API-->>User: accessToken + refreshToken
  User->>API: Authorization: Bearer accessToken
  API->>API: validate JWT claims
  API->>DB: query by organizationId from token
```

The main trust boundary is between the authenticated identity and organization-scoped resources. Client-provided `organizationId` values are never trusted for protected resource access.
