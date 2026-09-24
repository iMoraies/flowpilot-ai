import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkflowsPage } from './WorkflowsPage';
import { renderWithProviders } from '../../test/render';

vi.mock('../../services/apiClient', () => ({
  api: {
    listWorkflows: vi.fn().mockResolvedValue({
      data: [{
        id: 'wf_1',
        organizationId: 'org_1',
        name: 'Customer triage',
        description: 'Classify and route inbound requests',
        status: 'ACTIVE',
        version: 2,
        createdBy: 'user_1',
        steps: [],
        createdAt: '2026-09-24T00:00:00.000Z',
        updatedAt: '2026-09-24T00:00:00.000Z',
      }],
      pagination: { limit: 100, offset: 0, total: 1 },
    }),
  },
}));

describe('WorkflowsPage', () => {
  it('renders workflow list results from the API', async () => {
    renderWithProviders(<WorkflowsPage />);

    expect(await screen.findByText('Customer triage')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });
});
