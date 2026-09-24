import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TasksPage } from './TasksPage';
import { renderWithProviders } from '../../test/render';

const mocks = vi.hoisted(() => ({
  updateTask: vi.fn(),
  taskStatus: 'OPEN',
}));

vi.mock('../../services/apiClient', () => ({
  api: {
    listTasks: vi.fn().mockImplementation(async () => ({
      data: [{
        id: 'task_1',
        organizationId: 'org_1',
        executionId: 'execution_1',
        workflowStepId: 'step_1',
        title: 'Review invoice',
        description: 'Validate customer invoice data',
        status: mocks.taskStatus,
        assignedTo: null,
        createdAt: '2026-09-24T00:00:00.000Z',
        updatedAt: '2026-09-24T00:00:00.000Z',
        completedAt: null,
      }],
      pagination: { limit: 100, offset: 0, total: 1 },
    })),
    updateTask: mocks.updateTask,
  },
}));

describe('TasksPage', () => {
  it('updates task status from the status control', async () => {
    mocks.taskStatus = 'OPEN';
    mocks.updateTask.mockImplementation(async () => {
      mocks.taskStatus = 'DONE';
      return {
      id: 'task_1',
      organizationId: 'org_1',
      executionId: 'execution_1',
      workflowStepId: 'step_1',
      title: 'Review invoice',
      description: 'Validate customer invoice data',
      status: 'DONE',
      assignedTo: null,
      createdAt: '2026-09-24T00:00:00.000Z',
      updatedAt: '2026-09-24T00:00:00.000Z',
      completedAt: '2026-09-24T00:01:00.000Z',
      };
    });

    renderWithProviders(<TasksPage />);

    const statusControl = await screen.findByLabelText('Move Review invoice status');
    await userEvent.selectOptions(statusControl, 'DONE');

    expect(mocks.updateTask).toHaveBeenCalledWith('task_1', 'DONE');
    await waitFor(() => expect(statusControl).toHaveValue('DONE'));
  });
});
