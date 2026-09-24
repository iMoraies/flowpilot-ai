import type { Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import type { Pagination } from '../../shared/pagination/pagination';
import { toPaginatedResult } from '../../shared/pagination/pagination';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { CreateIntegrationBody, UpdateIntegrationBody } from './integration.schemas';

export async function createIntegration(auth: AuthenticatedUser, input: CreateIntegrationBody) {
  return prisma.integration.create({
    data: {
      organizationId: auth.organizationId,
      name: input.name,
      type: input.type,
      configuration: input.configuration as Prisma.InputJsonValue,
    },
  });
}

export async function listIntegrations(auth: AuthenticatedUser, pagination: Pagination) {
  const where = { organizationId: auth.organizationId };
  const [data, total] = await Promise.all([
    prisma.integration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pagination.limit,
      skip: pagination.offset,
    }),
    prisma.integration.count({ where }),
  ]);

  return toPaginatedResult(data, pagination, total);
}

export async function updateIntegration(
  auth: AuthenticatedUser,
  integrationId: string,
  input: UpdateIntegrationBody,
) {
  const integration = await prisma.integration.findFirst({
    where: { id: integrationId, organizationId: auth.organizationId },
  });

  if (!integration) {
    throw new AppError('INTEGRATION_NOT_FOUND', 'Integration not found', 404);
  }

  return prisma.integration.update({
    where: { id: integration.id },
    data: {
      name: input.name,
      type: input.type,
      configuration: input.configuration as Prisma.InputJsonValue | undefined,
    },
  });
}
