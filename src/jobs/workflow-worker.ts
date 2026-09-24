import { Worker } from 'bullmq';
import { loadEnv } from '../config/env';
import { getRedisClient } from '../infrastructure/redis/client';
import { WORKFLOW_EXECUTIONS_QUEUE } from '../infrastructure/queue/workflow-queue';
import { processExecution } from '../modules/executions/execution.engine';
import { buildApp } from '../app';

async function startWorker(): Promise<void> {
  const env = loadEnv();
  const app = await buildApp({ env });
  await app.ready();

  const worker = new Worker<{ executionId: string }>(
    WORKFLOW_EXECUTIONS_QUEUE,
    async (job) => {
      await processExecution(job.data.executionId, app.log.child({ jobId: job.id }));
    },
    {
      connection: getRedisClient(env),
      concurrency: 5,
    },
  );

  worker.on('failed', (job, error) => {
    app.log.error({ jobId: job?.id, err: error }, 'workflow execution job failed');
  });

  const shutdown = async (): Promise<void> => {
    await worker.close();
    await app.close();
  };

  process.on('SIGINT', () => void shutdown().then(() => process.exit(0)));
  process.on('SIGTERM', () => void shutdown().then(() => process.exit(0)));
}

void startWorker().catch((error) => {
  console.error(error);
  process.exit(1);
});
