import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/PageHeader';
import { ErrorState, LoadingState } from '../../components/StateBlocks';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../services/apiClient';
import type { PaginatedResult, Task, TaskStatus } from '../../types/api';

const statuses: Array<TaskStatus | ''> = ['', 'OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
const taskStatuses: TaskStatus[] = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

export function TasksPage() {
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const tasks = useQuery({ queryKey: ['tasks', status], queryFn: () => api.listTasks(status || undefined) });
  const updateTask = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: TaskStatus }) => api.updateTask(id, nextStatus),
    onMutate: async ({ id, nextStatus }) => {
      setError('');
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const snapshots = queryClient.getQueriesData<PaginatedResult<Task>>({ queryKey: ['tasks'] });

      snapshots.forEach(([queryKey, previous]) => {
        if (!previous) return;
        queryClient.setQueryData<PaginatedResult<Task>>(queryKey, {
          ...previous,
          data: previous.data
            .map((task) => task.id === id ? { ...task, status: nextStatus } : task)
            .filter((task) => {
              const queryStatus = Array.isArray(queryKey) ? queryKey[1] : undefined;
              return typeof queryStatus !== 'string' || !queryStatus || task.status === queryStatus;
            }),
        });
      });

      return { snapshots };
    },
    onError: (caught, _variables, context) => {
      context?.snapshots.forEach(([queryKey, previous]) => queryClient.setQueryData(queryKey, previous));
      setError(caught instanceof Error ? caught.message : 'Could not update task status.');
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueriesData<PaginatedResult<Task>>({ queryKey: ['tasks'] }, (previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          data: previous.data.map((task) => task.id === updatedTask.id ? updatedTask : task),
        };
      });
    },
    onSettled: async () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  if (tasks.isLoading) return <LoadingState />;
  if (tasks.isError) return <ErrorState message="Could not load tasks." />;

  return (
    <section className="page">
      <PageHeader title="Tasks" description="Review human work created by workflow executions." />
      <div className="toolbar">
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus | '')}>{statuses.map((item) => <option value={item} key={item || 'all'}>{item ? item.replaceAll('_', ' ') : 'All'}</option>)}</select></label>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="cards-grid">
        {tasks.data!.data.map((task) => (
          <article className="task-card" key={task.id}>
            <div className="card-heading">
              <div><h2>{task.title}</h2><p>{task.description ?? 'No description'}</p></div>
              <StatusBadge status={task.status} />
            </div>
            <div className="card-meta"><span>Execution {task.executionId.slice(0, 12)}</span><span>{new Date(task.createdAt).toLocaleDateString()}</span></div>
            <label>
              Move to
              <select
                value={task.status}
                onChange={(event) => updateTask.mutate({ id: task.id, nextStatus: event.target.value as TaskStatus })}
                disabled={updateTask.isPending && updateTask.variables?.id === task.id}
                aria-label={`Move ${task.title} status`}
              >
                {taskStatuses.map((item) => <option value={item} key={item}>{item.replaceAll('_', ' ')}</option>)}
              </select>
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
