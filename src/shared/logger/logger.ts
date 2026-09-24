import type { FastifyServerOptions } from 'fastify';
import type { Env } from '../../config/env';

function canUsePrettyTransport(env: Env): boolean {
  if (env.NODE_ENV !== 'development') {
    return false;
  }

  try {
    require.resolve('pino-pretty');
    return true;
  } catch {
    return false;
  }
}

export function createLoggerOptions(env: Env): FastifyServerOptions['logger'] {
  const loggerOptions: Exclude<FastifyServerOptions['logger'], boolean | undefined> = {
    level: env.LOG_LEVEL,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.token',
        'req.body.refreshToken',
        'req.body.secret',
        'req.body.clientSecret',
      ],
      censor: '[REDACTED]',
    },
  };

  if (canUsePrettyTransport(env)) {
    loggerOptions.transport = {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    };
  }

  return loggerOptions;
}
