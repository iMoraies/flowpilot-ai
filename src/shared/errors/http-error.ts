import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './app-error';

type ErrorResponse = {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
};

function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  requestId: string,
): void {
  reply.status(statusCode).send({
    error: {
      code,
      message,
      requestId,
    },
  } satisfies ErrorResponse);
}

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    sendError(reply, 404, 'NOT_FOUND', 'Route not found', request.id);
  });

  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      request.log.warn({ errorCode: error.code }, error.message);
      sendError(reply, error.statusCode, error.code, error.message, request.id);
      return;
    }

    if (error instanceof ZodError) {
      request.log.warn({ validation: error.issues }, 'Request validation failed');
      sendError(reply, 400, 'VALIDATION_ERROR', 'Request validation failed', request.id);
      return;
    }

    if (error.validation) {
      request.log.warn({ validation: error.validation }, 'Request validation failed');
      sendError(reply, 400, 'VALIDATION_ERROR', 'Request validation failed', request.id);
      return;
    }

    request.log.error({ err: error }, 'Unexpected application error');
    sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error', request.id);
  });
}
