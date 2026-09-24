import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { JsonBlock } from '../../components/JsonBlock';
import { PageHeader } from '../../components/PageHeader';
import { ErrorState, LoadingState } from '../../components/StateBlocks';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../services/apiClient';

export function ExecutionDetailPage() {
  const { id } = useParams();
  const execution = useQuery({ queryKey: ['execution', id], queryFn: () => api.getExecution(id!) });

  if (execution.isLoading) return <LoadingState />;
  if (execution.isError || !execution.data) return <ErrorState message="Could not load execution." />;

  const current = execution.data;

  return (
    <section className="page">
      <PageHeader
        title={`Execution ${current.id.slice(0, 12)}`}
        description={`Workflow ${current.workflowId.slice(0, 12)} at version ${current.workflowVersion}`}
        actions={<Link className="button" to={`/workflows/${current.workflowId}`}>Open workflow</Link>}
      />
      <div className="detail-strip">
        <StatusBadge status={current.status} />
        <span>Created {new Date(current.createdAt).toLocaleString()}</span>
        <span>{current.steps?.length ?? 0} steps</span>
      </div>
      <div className="content-grid">
        <section className="panel">
          <h2>Input</h2>
          <JsonBlock value={current.input} />
        </section>
        <section className="panel">
          <h2>Output</h2>
          <JsonBlock value={current.output ?? current.error ?? {}} />
        </section>
      </div>
      <section className="panel">
        <h2>Step timeline</h2>
        <div className="list-stack">
          {(current.steps ?? []).map((step) => (
            <details className="detail-row" key={step.id}>
              <summary><strong>{step.workflowStepId.slice(0, 12)}</strong><StatusBadge status={step.status} /></summary>
              <JsonBlock value={{ input: step.input, output: step.output, error: step.error, attempt: step.attempt }} />
            </details>
          ))}
        </div>
      </section>
    </section>
  );
}
