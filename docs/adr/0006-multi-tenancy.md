# ADR 0006: Multi-Tenancy

## Context

FlowPilot AI will manage resources for multiple organizations. Cross-tenant access is one of the highest-risk bugs in this kind of system.

## Decision

Use organization-scoped data access from the beginning. Protected routes derive `organizationId` from the authenticated token, not from client payloads. User management queries filter by the authenticated organization.

## Alternatives Considered

- Trust `organizationId` in request bodies or query strings: rejected because clients can tamper with it.
- Separate database per tenant: strong isolation, but too much operational overhead for this stage.
- Schema per tenant: also stronger isolation, but premature before the product model stabilizes.

## Consequences

The system stays simple while establishing the right habit: every future workflow, task, integration, and audit query must include organization scope from the auth context. The trade-off is that developers must consistently apply this pattern until stronger database-level policies are introduced.
