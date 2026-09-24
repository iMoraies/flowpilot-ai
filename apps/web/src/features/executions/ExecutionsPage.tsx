import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { ErrorState, LoadingState } from '../../components/StateBlocks';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../services/apiClient';
import type { ExecutionStatus } from '../../types/api';

const statuses: Array<ExecutionStatus | ''> = ['', 'PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED'];

export function ExecutionsPage() {
  const [status, setStatus] = useState<ExecutionStatus | ''>('');
  const executions = useQuery({ queryKey: ['executions', status], queryFn: () => api.listExecutions(status ? { status } : {}) });

  if (executions.isLoading) return <LoadingState />;
  if (executions.isError) return <ErrorState message="Could not load executions." />;

  return (
    <section className="page">
      <PageHeader title="Executions" description="Track workflow runs and inspect step-by-step results." />
      <div className="toolbar">
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as ExecutionStatus | '')}>{statuses.map((item) => <option value={item} key={item || 'all'}>{item ? item.replaceAll('_', ' ') : 'All'}</option>)}</select></label>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Status</th><th>Workflow</th><th>Created</th><th>Tasks</th></tr></thead>
          <tbody>
            {executions.data!.data.map((execution) => (
              <tr key={execution.id}>
                <td><Link to={`/executions/${execution.id}`}>{execution.id.slice(0, 14)}</Link></td>
                <td><StatusBadge status={execution.status} /></td>
                <td>{execution.workflowId.slice(0, 12)} v{execution.workflowVersion}</td>
                <td>{new Date(execution.createdAt).toLocaleString()}</td>
                <td>{execution.tasks?.length ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
