import { prisma } from '../src/infrastructure/database/prisma';
import { hashPassword } from '../src/modules/auth/password';

async function main(): Promise<void> {
  const passwordHash = await hashPassword('demo-password');

  const organization = await prisma.organization.upsert({
    where: { id: 'demo_org' },
    update: {},
    create: {
      id: 'demo_org',
      name: 'FlowPilot Demo',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@flowpilot.local' },
    update: {},
    create: {
      organizationId: organization.id,
      name: 'Demo Admin',
      email: 'admin@flowpilot.local',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const workflow = await prisma.workflow.create({
    data: {
      organizationId: organization.id,
      createdBy: admin.id,
      name: 'Support Request Automation',
      description: 'Demo workflow for AI classification, branching, task creation, and notification.',
    },
  });

  const manual = await prisma.workflowStep.create({
    data: {
      workflowId: workflow.id,
      name: 'Request received',
      type: 'MANUAL',
      configuration: {},
      position: 1,
    },
  });

  const ai = await prisma.workflowStep.create({
    data: {
      workflowId: workflow.id,
      name: 'Classify request',
      type: 'AI_CLASSIFICATION',
      configuration: {
        inputPath: 'input.message',
        categories: ['TECHNICAL', 'BILLING', 'GENERAL'],
        outputKey: 'classification',
      },
      position: 2,
    },
  });

  const condition = await prisma.workflowStep.create({
    data: {
      workflowId: workflow.id,
      name: 'Technical branch',
      type: 'CONDITION',
      configuration: {
        field: 'classification',
        operator: 'equals',
        value: 'TECHNICAL',
        onTrue: 'placeholder',
      },
      position: 3,
    },
  });

  const task = await prisma.workflowStep.create({
    data: {
      workflowId: workflow.id,
      name: 'Create support task',
      type: 'CREATE_TASK',
      configuration: {
        title: 'Handle technical support request',
        description: 'Created by demo workflow.',
      },
      position: 4,
    },
  });

  const notification = await prisma.workflowStep.create({
    data: {
      workflowId: workflow.id,
      name: 'Notify team',
      type: 'NOTIFICATION',
      configuration: {
        message: 'A non-technical support request was classified and logged.',
      },
      position: 5,
    },
  });

  await prisma.workflowStep.update({ where: { id: manual.id }, data: { nextStepId: ai.id } });
  await prisma.workflowStep.update({ where: { id: ai.id }, data: { nextStepId: condition.id } });
  await prisma.workflowStep.update({
    where: { id: condition.id },
    data: {
      configuration: {
        field: 'classification',
        operator: 'equals',
        value: 'TECHNICAL',
        onTrue: task.id,
        onFalse: notification.id,
      },
    },
  });

  await prisma.workflow.update({
    where: { id: workflow.id },
    data: { status: 'ACTIVE' },
  });

  console.log('Demo seed complete');
  console.log('Email: admin@flowpilot.local');
  console.log('Password: demo-password');
}

void main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
