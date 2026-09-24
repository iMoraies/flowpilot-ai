import { Queue } from 'bullmq';
import type { Env } from '../../config/env';
import { getRedisClient } from '../redis/client';

export const WORKFLOW_EXECUTIONS_QUEUE = 'workflow-executions';

let workflowQueue: Queue<{ executionId: string }> | null = null;

export function getWorkflowExecutionQueue(env: Env): Queue<{ executionId: string }> {
  if (!workflowQueue) {
    workflowQueue = new Queue(WORKFLOW_EXECUTIONS_QUEUE, {
      connection: getRedisClient(env),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }

  return workflowQueue;
}
