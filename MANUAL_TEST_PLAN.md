# Manual Test Plan

1. Docker startup
   - Action: run `docker compose up --build`.
   - Expected: api, worker, postgres, and redis start.
   - Failure: unhealthy container, startup error, or port conflict.

2. Swagger
   - Action: open `http://localhost:3333/docs`.
   - Expected: API documentation loads.
   - Failure: 404 or broken OpenAPI rendering.

3. Register
   - Action: call `POST /api/v1/auth/register`.
   - Expected: organization, admin user, access token, and refresh token.
   - Failure: missing token or leaked `passwordHash`.

4. Login
   - Action: call `POST /api/v1/auth/login`.
   - Expected: valid tokens and public user.
   - Failure: valid credentials rejected.

5. Refresh
   - Action: call `POST /api/v1/auth/refresh`.
   - Expected: new access and refresh token.
   - Failure: old refresh token remains reusable.

6. Logout
   - Action: call `POST /api/v1/auth/logout`.
   - Expected: refresh token revoked.
   - Failure: refresh still succeeds.

7. RBAC
   - Action: use a MEMBER token against `POST /api/v1/users`.
   - Expected: `403 AUTH_FORBIDDEN`.
   - Failure: MEMBER can administer users.

8. Multi-tenancy
   - Action: create two organizations and list users from each token.
   - Expected: each sees only its organization.
   - Failure: cross-tenant data appears.

9. Workflow creation
   - Action: create workflow and steps.
   - Expected: workflow remains DRAFT until activation.
   - Failure: invalid workflow activates.

10. Activation
    - Action: activate valid workflow.
    - Expected: status becomes ACTIVE.
    - Failure: missing or invalid step references accepted.

11. Execution
    - Action: execute active workflow.
    - Expected: API returns `202` and execution starts as PENDING.
    - Failure: API waits for all steps or fails to enqueue.

12. Branching
    - Action: execute input that matches a CONDITION.
    - Expected: correct branch step runs.
    - Failure: both branches run or wrong branch runs.

13. AI mock
    - Action: run demo workflow with TECHNICAL text.
    - Expected: classification is TECHNICAL.
    - Failure: category outside allowed list.

14. HTTP integration
    - Action: add HTTP_REQUEST to a public mock endpoint.
    - Expected: response summary stored.
    - Failure: local/private URLs are allowed.

15. Task
    - Action: execute branch that creates task.
    - Expected: task appears in `/api/v1/tasks`.
    - Failure: task missing or wrong organization.

16. Notification
    - Action: execute notification branch.
    - Expected: structured log notification.
    - Failure: secrets or tokens logged.

17. Audit
    - Action: call `/api/v1/audit-logs`.
    - Expected: workflow/execution/task/auth events.
    - Failure: no audit records or cross-tenant records.

18. Idempotency
    - Action: execute twice with same `Idempotency-Key`.
    - Expected: same execution returned.
    - Failure: duplicate executions created.

19. Failure and retry
    - Action: configure invalid HTTP_REQUEST.
    - Expected: execution eventually FAILED.
    - Failure: worker loops forever.

20. Logs
    - Action: inspect API and worker logs.
    - Expected: requestId and contextual IDs, no secrets.
    - Failure: token/password appears.

21. Metrics
    - Action: open `/metrics`.
    - Expected: Prometheus text output.
    - Failure: endpoint unavailable when enabled.

22. Health
    - Action: open `/health`.
    - Expected: `{ "status": "ok" }`.
    - Failure: dependency failure changes liveness.

23. Readiness
    - Action: stop Redis and open `/ready`.
    - Expected: degraded status.
    - Failure: readiness still reports ok.
