import type { FastifyInstance } from 'fastify';
import { authenticate, requireAnyRole } from '../auth/auth.guards';
import { parsePagination } from '../../shared/pagination/pagination';
import {
  activateWorkflow,
  addWorkflowStep,
  createWorkflow,
  deactivateWorkflow,
  deleteWorkflow,
  deleteWorkflowStep,
  getWorkflow,
  listWorkflows,
  updateWorkflow,
  updateWorkflowStep,
} from './workflow.service';
import {
  createStepSchema,
  createWorkflowSchema,
  updateStepSchema,
  updateWorkflowSchema,
} from './workflow.schemas';

const canManageWorkflows = requireAnyRole(['ADMIN', 'MANAGER']);
const canViewOrExecuteWorkflows = requireAnyRole(['ADMIN', 'MANAGER', 'MEMBER']);

export async function registerWorkflowRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/workflows',
    { preHandler: [authenticate, canManageWorkflows], schema: { tags: ['Workflows'] } },
    async (request, reply) => {
      const workflow = await createWorkflow(request.auth!, createWorkflowSchema.parse(request.body));
      return reply.status(201).send(workflow);
    },
  );

  app.get(
    '/workflows',
    { preHandler: [authenticate, canViewOrExecuteWorkflows], schema: { tags: ['Workflows'] } },
    async (request) => listWorkflows(request.auth!, parsePagination(request.query)),
  );

  app.get(
    '/workflows/:id',
    { preHandler: [authenticate, canViewOrExecuteWorkflows], schema: { tags: ['Workflows'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      return getWorkflow(request.auth!, id);
    },
  );

  app.patch(
    '/workflows/:id',
    { preHandler: [authenticate, canManageWorkflows], schema: { tags: ['Workflows'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      return updateWorkflow(request.auth!, id, updateWorkflowSchema.parse(request.body));
    },
  );

  app.delete(
    '/workflows/:id',
    { preHandler: [authenticate, requireAnyRole(['ADMIN'])], schema: { tags: ['Workflows'] } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await deleteWorkflow(request.auth!, id);
      return reply.status(204).send();
    },
  );

  app.post(
    '/workflows/:id/steps',
    { preHandler: [authenticate, canManageWorkflows], schema: { tags: ['Workflow Steps'] } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const step = await addWorkflowStep(request.auth!, id, createStepSchema.parse(request.body));
      return reply.status(201).send(step);
    },
  );

  app.patch(
    '/workflows/:id/steps/:stepId',
    { preHandler: [authenticate, canManageWorkflows], schema: { tags: ['Workflow Steps'] } },
    async (request) => {
      const { id, stepId } = request.params as { id: string; stepId: string };
      return updateWorkflowStep(request.auth!, id, stepId, updateStepSchema.parse(request.body));
    },
  );

  app.delete(
    '/workflows/:id/steps/:stepId',
    { preHandler: [authenticate, canManageWorkflows], schema: { tags: ['Workflow Steps'] } },
    async (request, reply) => {
      const { id, stepId } = request.params as { id: string; stepId: string };
      await deleteWorkflowStep(request.auth!, id, stepId);
      return reply.status(204).send();
    },
  );

  app.post(
    '/workflows/:id/activate',
    { preHandler: [authenticate, canManageWorkflows], schema: { tags: ['Workflows'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      return activateWorkflow(request.auth!, id);
    },
  );

  app.post(
    '/workflows/:id/deactivate',
    { preHandler: [authenticate, canManageWorkflows], schema: { tags: ['Workflows'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      return deactivateWorkflow(request.auth!, id);
    },
  );
}
