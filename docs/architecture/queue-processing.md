# Queue Processing

BullMQ processes `workflow-executions` jobs.

```mermaid
flowchart TD
  A[POST execution] --> B[Create Execution PENDING]
  B --> C[Add BullMQ job]
  C --> D[Worker claims execution]
  D --> E{status is PENDING?}
  E -- no --> F[Skip duplicate job]
  E -- yes --> G[RUNNING]
  G --> H[Process steps]
  H --> I{success?}
  I -- yes --> J[SUCCESS]
  I -- no --> K[FAILED]
```

Retries are limited to three attempts with exponential backoff. The engine protects against duplicate processing by requiring the execution to still be `PENDING` before it can transition to `RUNNING`.
