import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/PageHeader';
import { ErrorState, LoadingState } from '../../components/StateBlocks';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../services/apiClient';
import type { TaskStatus } from '../../types/api';

const statuses: Array<TaskStatus | ''> = ['', 'OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

export function TasksPage() {
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const queryClient = useQueryClient();
  const tasks = useQuery({ queryKey: ['tasks', status], queryFn: () => api.listTasks(status || undefined) });
  const updateTask = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: TaskStatus }) => api.updateTask(id, nextStatus),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  if (tasks.isLoading) return <LoadingState />;
  if (tasks.isError) return <ErrorState message="Could not load tasks." />;

  return (
    <section className="page">
      <PageHeader title="Tasks" description="Review human work created by workflow executions." />
      <div className="toolbar">
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus | '')}>{statuses.map((item) => <option value={item} key={item || 'all'}>{item ? item.replaceAll('_', ' ') : 'All'}</option>)}</select></label>
      </div>
      <div className="cards-grid">
        {tasks.data!.data.map((task) => (
          <article className="task-card" key={task.id}>
            <div className="card-heading">
              <div><h2>{task.title}</h2><p>{task.description ?? 'No description'}</p></div>
              <StatusBadge status={task.status} />
            </div>
            <div className="card-meta"><span>Execution {task.executionId.slice(0, 12)}</span><span>{new Date(task.createdAt).toLocaleDateString()}</span></div>
            <label>Move to<select value={task.status} onChange={(event) => updateTask.mutate({ id: task.id, nextStatus: event.target.value as TaskStatus })}>{statuses.filter(Boolean).map((item) => <option value={item} key={item}>{item.replaceAll('_', ' ')}</option>)}</select></label>
          </article>
        ))}
      </div>
    </section>
  );
}
