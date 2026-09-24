import client from 'prom-client';
import type { FastifyInstance } from 'fastify';
import type { Env } from '../../config/env';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestCount = new client.Counter({
  name: 'flowpilot_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'flowpilot_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const workflowExecutionCount = new client.Counter({
  name: 'flowpilot_workflow_executions_total',
  help: 'Workflow executions by status',
  labelNames: ['status'],
  registers: [register],
});

export const workflowFailureCount = new client.Counter({
  name: 'flowpilot_workflow_failures_total',
  help: 'Workflow execution failures',
  registers: [register],
});

export function registerMetrics(app: FastifyInstance, env: Env): void {
  if (!env.ENABLE_METRICS) {
    return;
  }

  app.addHook('onRequest', async (request) => {
    request.startTime = process.hrtime.bigint();
  });

  app.addHook('onResponse', async (request, reply) => {
    const start = request.startTime;
    if (!start) {
      return;
    }

    const duration = Number(process.hrtime.bigint() - start) / 1_000_000_000;
    const route = request.routeOptions.url ?? request.url;
    httpRequestCount.inc({ method: request.method, route, status_code: reply.statusCode });
    httpRequestDuration.observe({ method: request.method, route, status_code: reply.statusCode }, duration);
  });

  app.get('/metrics', async (_request, reply) => {
    return reply.header('Content-Type', register.contentType).send(await register.metrics());
  });
}
