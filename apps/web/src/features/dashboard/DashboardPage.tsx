import { useQuery } from '@tanstack/react-query';
import { Activity, ClipboardCheck, FileClock, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ErrorState, LoadingState } from '../../components/StateBlocks';
import { api } from '../../services/apiClient';

export function DashboardPage() {
  const workflows = useQuery({ queryKey: ['workflows'], queryFn: api.listWorkflows });
  const executions = useQuery({ queryKey: ['executions'], queryFn: () => api.listExecutions() });
  const tasks = useQuery({ queryKey: ['tasks'], queryFn: () => api.listTasks() });
  const ready = useQuery({ queryKey: ['ready'], queryFn: api.ready });

  if (workflows.isLoading || executions.isLoading || tasks.isLoading) {
    return <LoadingState />;
  }

  if (workflows.isError || executions.isError || tasks.isError) {
    return <ErrorState message="Could not load dashboard data." />;
  }

  const executionRows = executions.data?.data ?? [];
  const successCount = executionRows.filter((execution) => execution.status === 'SUCCESS').length;
  const successRate = executionRows.length ? Math.round((successCount / executionRows.length) * 100) : 0;
  const openTasks = (tasks.data?.data ?? []).filter((task) => task.status === 'OPEN' || task.status === 'IN_PROGRESS');

  return (
    <section className="page">
      <PageHeader title="Dashboard" description="Operational pulse for workflows, executions, tasks, and platform readiness." />
      <div className="stats-grid">
        <StatCard label="Workflows" value={workflows.data?.pagination.total ?? 0} detail="Definitions in this organization" icon={<Workflow size={20} />} />
        <StatCard label="Executions" value={executions.data?.pagination.total ?? 0} detail={`${successRate}% success in current page`} icon={<FileClock size={20} />} />
        <StatCard label="Open tasks" value={openTasks.length} detail="Human work still pending" icon={<ClipboardCheck size={20} />} />
        <StatCard label="Readiness" value={ready.data?.status ?? 'checking'} detail="API dependencies" icon={<Activity size={20} />} />
      </div>
      <div className="content-grid">
        <section className="panel">
          <h2>Recent executions</h2>
          <div className="list-stack">
            {executionRows.slice(0, 6).map((execution) => (
              <Link className="list-row" to={`/executions/${execution.id}`} key={execution.id}>
                <div>
                  <strong>{execution.id.slice(0, 12)}</strong>
                  <span>Workflow v{execution.workflowVersion}</span>
                </div>
                <StatusBadge status={execution.status} />
              </Link>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Open tasks</h2>
          <div className="list-stack">
            {openTasks.slice(0, 6).map((task) => (
              <Link className="list-row" to="/tasks" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.description ?? 'No description'}</span>
                </div>
                <StatusBadge status={task.status} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
