import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { ErrorState, LoadingState } from '../../components/StateBlocks';
import { api } from '../../services/apiClient';
import type { WorkflowStepType } from '../../types/api';
import { parseConfiguration, stepTypes } from './workflowForms';

export function WorkflowEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workflow = useQuery({ queryKey: ['workflow', id], queryFn: () => api.getWorkflow(id!), enabled: isEditing });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stepName, setStepName] = useState('');
  const [stepType, setStepType] = useState<WorkflowStepType>('MANUAL');
  const [stepPosition, setStepPosition] = useState(1);
  const [stepConfig, setStepConfig] = useState('{}');
  const [error, setError] = useState('');

  useEffect(() => {
    if (workflow.data) {
      setName(workflow.data.name);
      setDescription(workflow.data.description ?? '');
      setStepPosition(workflow.data.steps.length + 1);
    }
  }, [workflow.data]);

  const canSubmit = name.trim().length >= 2;
  const steps = useMemo(() => workflow.data?.steps ?? [], [workflow.data]);

  const saveWorkflow = useMutation({
    mutationFn: async () => {
      const input = { name: name.trim(), description: description.trim() || undefined };
      return isEditing ? api.updateWorkflow(id!, input) : api.createWorkflow(input);
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['workflows'] });
      navigate(`/workflows/${saved.id}/edit`, { replace: true });
    },
  });

  const addStep = useMutation({
    mutationFn: () => api.addStep(id!, {
      name: stepName.trim(),
      type: stepType,
      position: stepPosition,
      configuration: parseConfiguration(stepConfig),
    }),
    onSuccess: async () => {
      setStepName('');
      setStepConfig('{}');
      await queryClient.invalidateQueries({ queryKey: ['workflow', id] });
    },
  });

  const deleteStep = useMutation({
    mutationFn: (stepId: string) => api.deleteStep(id!, stepId),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['workflow', id] }),
  });

  async function handleWorkflowSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!canSubmit) {
      setError('Workflow name must contain at least 2 characters.');
      return;
    }
    await saveWorkflow.mutateAsync().catch((caught: Error) => setError(caught.message));
  }

  async function handleStepSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (stepName.trim().length < 2) {
      setError('Step name must contain at least 2 characters.');
      return;
    }
    await addStep.mutateAsync().catch((caught: Error) => setError(caught.message));
  }

  if (workflow.isLoading) return <LoadingState />;
  if (workflow.isError) return <ErrorState message="Could not load workflow." />;

  return (
    <section className="page">
      <PageHeader
        title={isEditing ? 'Edit workflow' : 'New workflow'}
        description="Define workflow metadata and append ordered steps."
        actions={id ? <Link className="button" to={`/workflows/${id}`}>View workflow</Link> : null}
      />
      <div className="content-grid">
        <form className="panel form-stack" onSubmit={handleWorkflowSubmit}>
          <h2>Workflow</h2>
          <label>Name<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} required /></label>
          <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button primary" type="submit" disabled={!canSubmit || saveWorkflow.isPending}><Save size={16} /> Save workflow</button>
        </form>
        <form className="panel form-stack" onSubmit={handleStepSubmit}>
          <h2>Add step</h2>
          {!id ? <p className="muted">Save the workflow before adding steps.</p> : null}
          <label>Step name<input value={stepName} onChange={(event) => setStepName(event.target.value)} minLength={2} disabled={!id} /></label>
          <label>Type<select value={stepType} onChange={(event) => setStepType(event.target.value as WorkflowStepType)} disabled={!id}>{stepTypes.map((type) => <option value={type} key={type}>{type.replaceAll('_', ' ')}</option>)}</select></label>
          <label>Position<input type="number" min={1} value={stepPosition} onChange={(event) => setStepPosition(Number(event.target.value))} disabled={!id} /></label>
          <label>Configuration JSON<textarea value={stepConfig} onChange={(event) => setStepConfig(event.target.value)} rows={7} disabled={!id} /></label>
          <button className="button primary" type="submit" disabled={!id || addStep.isPending}>Add step</button>
        </form>
      </div>
      {id ? (
        <section className="panel">
          <h2>Current steps</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Position</th><th>Name</th><th>Type</th><th>Action</th></tr></thead>
              <tbody>
                {steps.map((step) => (
                  <tr key={step.id}>
                    <td>{step.position}</td>
                    <td>{step.name}</td>
                    <td>{step.type.replaceAll('_', ' ')}</td>
                    <td><button className="icon-button danger" type="button" onClick={() => deleteStep.mutate(step.id)} aria-label={`Delete ${step.name}`}><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </section>
  );
}
