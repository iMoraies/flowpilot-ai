import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Play } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { JsonBlock } from '../../components/JsonBlock';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { ErrorState, LoadingState } from '../../components/StateBlocks';
import { StatusBadge } from '../../components/StatusBadge';
import { WorkflowDiagram } from '../../components/WorkflowDiagram';
import { api } from '../../services/apiClient';
import { parseConfiguration } from './workflowForms';

export function WorkflowDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRunOpen, setIsRunOpen] = useState(false);
  const [input, setInput] = useState('{"message":"Demo request"}');
  const [error, setError] = useState('');
  const workflow = useQuery({ queryKey: ['workflow', id], queryFn: () => api.getWorkflow(id!) });
  const executions = useQuery({ queryKey: ['executions', id], queryFn: () => api.listExecutions({ workflowId: id }) });

  const activate = useMutation({
    mutationFn: () => api.activateWorkflow(id!),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['workflow', id] }),
  });
  const deactivate = useMutation({
    mutationFn: () => api.deactivateWorkflow(id!),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['workflow', id] }),
  });
  const run = useMutation({
    mutationFn: () => api.runWorkflow(id!, parseConfiguration(input)),
    onSuccess: (execution) => navigate(`/executions/${execution.id}`),
  });

  async function handleRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    await run.mutateAsync().catch((caught: Error) => setError(caught.message));
  }

  if (workflow.isLoading) return <LoadingState />;
  if (workflow.isError || !workflow.data) return <ErrorState message="Could not load workflow." />;

  const current = workflow.data;

  return (
    <section className="page">
      <PageHeader
        title={current.name}
        description={current.description ?? 'No description'}
        actions={
          <>
            <Link className="button" to={`/workflows/${current.id}/edit`}><Edit size={16} /> Edit</Link>
            {current.status === 'ACTIVE' ? (
              <button className="button" type="button" onClick={() => deactivate.mutate()}>Deactivate</button>
            ) : (
              <button className="button" type="button" onClick={() => activate.mutate()}>Activate</button>
            )}
            <button className="button primary" type="button" onClick={() => setIsRunOpen(true)} disabled={current.status !== 'ACTIVE'}><Play size={16} /> Run</button>
          </>
        }
      />
      <div className="detail-strip">
        <StatusBadge status={current.status} />
        <span>Version {current.version}</span>
        <span>{current.steps.length} steps</span>
      </div>
      <section className="panel">
        <h2>Builder</h2>
        <WorkflowDiagram steps={current.steps} />
      </section>
      <div className="content-grid">
        <section className="panel">
          <h2>Step configuration</h2>
          <div className="list-stack">
            {current.steps.map((step) => (
              <details className="detail-row" key={step.id}>
                <summary><strong>{step.position}. {step.name}</strong><span>{step.type.replaceAll('_', ' ')}</span></summary>
                <JsonBlock value={step.configuration} />
              </details>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Recent executions</h2>
          <div className="list-stack">
            {(executions.data?.data ?? []).slice(0, 6).map((execution) => (
              <Link className="list-row" to={`/executions/${execution.id}`} key={execution.id}>
                <div><strong>{execution.id.slice(0, 12)}</strong><span>{new Date(execution.createdAt).toLocaleString()}</span></div>
                <StatusBadge status={execution.status} />
              </Link>
            ))}
          </div>
        </section>
      </div>
      {isRunOpen ? (
        <Modal title="Run workflow" onClose={() => setIsRunOpen(false)}>
          <form className="form-stack" onSubmit={handleRun}>
            <label>Execution input JSON<textarea value={input} onChange={(event) => setInput(event.target.value)} rows={8} /></label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="button primary" type="submit" disabled={run.isPending}>Start execution</button>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
