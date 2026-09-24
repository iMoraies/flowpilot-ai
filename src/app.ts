import { randomUUID } from 'node:crypto';
import fastify, { type FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { loadEnv, type Env } from './config/env';
import { checkDatabaseConnection, prisma } from './infrastructure/database/prisma';
import { checkRedisConnection } from './infrastructure/redis/client';
import { initializeTracing } from './infrastructure/observability/tracing';
import { registerMetrics } from './infrastructure/observability/metrics';
import type { AuthRepository } from './modules/auth/auth.repository';
import { PrismaAuthRepository } from './modules/auth/prisma-auth.repository';
import { registerAuthRoutes } from './modules/auth/auth.routes';
import { registerUsersRoutes } from './modules/users/users.routes';
import { registerWorkflowRoutes } from './modules/workflows/workflow.routes';
import { registerExecutionRoutes } from './modules/executions/execution.routes';
import { registerTaskRoutes } from './modules/tasks/task.routes';
import { registerIntegrationRoutes } from './modules/integrations/integration.routes';
import { registerAuditRoutes } from './modules/audit/audit.routes';
import { registerErrorHandlers } from './shared/errors/http-error';
import { createLoggerOptions } from './shared/logger/logger';

type ServiceStatus = 'up' | 'down';

type HealthCheck = {
  database: () => Promise<ServiceStatus>;
  redis: () => Promise<ServiceStatus>;
};

type BuildAppOptions = {
  env?: Env;
  healthCheck?: HealthCheck;
  authRepository?: AuthRepository;
};

const REQUEST_ID_HEADER = 'x-request-id';

function getRequestId(request: { headers: Record<string, string | string[] | undefined> }): string {
  const header = request.headers[REQUEST_ID_HEADER];
  const requestId = Array.isArray(header) ? header[0] : header;

  if (requestId && requestId.length <= 128) {
    return requestId;
  }

  return randomUUID();
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const appEnv = options.env ?? loadEnv();
  initializeTracing();
  const authRepository = options.authRepository ?? new PrismaAuthRepository(prisma);
  const healthCheck = options.healthCheck ?? {
    database: checkDatabaseConnection,
    redis: () => checkRedisConnection(appEnv),
  };

  const app = fastify({
    logger: createLoggerOptions(appEnv),
    genReqId: getRequestId,
  });

  app.addHook('onRequest', async (request, reply) => {
    reply.header(REQUEST_ID_HEADER, request.id);
  });

  registerErrorHandlers(app);
  registerMetrics(app, appEnv);

  app.decorate('authRepository', authRepository);

  await app.register(fastifyJwt, {
    secret: appEnv.JWT_SECRET,
  });

  await app.register(fastifyRateLimit, {
    global: false,
  });

  if (appEnv.ENABLE_SWAGGER) {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'FlowPilot AI API',
          description: 'API foundation for FlowPilot AI.',
          version: '0.1.0',
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
    });

    await app.register(swaggerUi, {
      routePrefix: '/docs',
    });
  }

  app.addSchema({
    $id: 'ErrorResponse',
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['code', 'message', 'requestId'],
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          requestId: { type: 'string' },
        },
      },
    },
  });

  app.addSchema({
    $id: 'PublicUser',
    type: 'object',
    required: ['id', 'organizationId', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
    properties: {
      id: { type: 'string' },
      organizationId: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'MEMBER'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  });

  app.addSchema({
    $id: 'PublicOrganization',
    type: 'object',
    required: ['id', 'name', 'createdAt', 'updatedAt'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  });

  await app.register(
    async (api) => {
      await registerAuthRoutes(api, appEnv);
      await registerUsersRoutes(api);
      await registerWorkflowRoutes(api);
      await registerExecutionRoutes(api, appEnv);
      await registerTaskRoutes(api);
      await registerIntegrationRoutes(api);
      await registerAuditRoutes(api);
    },
    {
      prefix: '/api/v1',
    },
  );

  app.get('/health', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok' });
  });

  app.get('/ready', async (_request, reply) => {
    const [database, redis] = await Promise.all([healthCheck.database(), healthCheck.redis()]);
    const isHealthy = database === 'up' && redis === 'up';

    return reply.status(isHealthy ? 200 : 503).send({
      status: isHealthy ? 'ok' : 'degraded',
      services: {
        database,
        redis,
      },
    });
  });

  return app;
}
