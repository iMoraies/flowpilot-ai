import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateBlocks';
import { api } from '../../services/apiClient';

export function WorkflowsPage() {
  const workflows = useQuery({ queryKey: ['workflows'], queryFn: api.listWorkflows });

  if (workflows.isLoading) return <LoadingState />;
  if (workflows.isError) return <ErrorState message="Could not load workflows." />;

  return (
    <section className="page">
      <PageHeader
        title="Workflows"
        description="Create, activate, and run versioned workflow definitions."
        actions={<Link className="button primary" to="/workflows/new"><Plus size={16} /> New workflow</Link>}
      />
      {workflows.data!.data.length === 0 ? (
        <EmptyState title="No workflows yet" description="Create the first workflow to start modeling automation." />
      ) : (
        <div className="cards-grid">
          {workflows.data!.data.map((workflow) => (
            <Link className="workflow-card" to={`/workflows/${workflow.id}`} key={workflow.id}>
              <div className="card-heading">
                <div>
                  <h2>{workflow.name}</h2>
                  <p>{workflow.description ?? 'No description'}</p>
                </div>
                <StatusBadge status={workflow.status} />
              </div>
              <div className="card-meta">
                <span>v{workflow.version}</span>
                <span>{workflow.steps.length} steps</span>
                <span>{new Date(workflow.updatedAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
