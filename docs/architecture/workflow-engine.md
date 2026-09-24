# Workflow Engine

Workflow definitions are stored as `Workflow` and `WorkflowStep`. Executions store `workflowVersion` and a `workflowSnapshot` so old executions preserve the exact definition they used.

```mermaid
sequenceDiagram
  participant API
  participant DB as PostgreSQL
  participant Q as BullMQ
  participant W as Worker

  API->>DB: create Execution PENDING + snapshot
  API->>Q: enqueue executionId
  API-->>API: return 202
  Q->>W: process executionId
  W->>DB: PENDING -> RUNNING
  loop steps
    W->>DB: persist ExecutionStep
    W->>W: choose next step
  end
  W->>DB: mark SUCCESS or FAILED
```

Branching is intentionally simple. A step can declare `nextStepId`, and `CONDITION` can return either `onTrue` or `onFalse`. There is no arbitrary code execution and no JavaScript `eval`.
