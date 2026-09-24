import { useQuery } from '@tanstack/react-query';
import { Activity, Database, Server, Waves } from 'lucide-react';
import { JsonBlock } from '../../components/JsonBlock';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ErrorState, LoadingState } from '../../components/StateBlocks';
import { api, apiBaseUrl } from '../../services/apiClient';

export function SystemPage() {
  const health = useQuery({ queryKey: ['health'], queryFn: api.health });
  const ready = useQuery({ queryKey: ['ready'], queryFn: api.ready });
  const metrics = useQuery({ queryKey: ['metrics'], queryFn: api.metrics });

  if (health.isLoading || ready.isLoading) return <LoadingState />;
  if (health.isError || ready.isError) return <ErrorState message="Could not load system status." />;

  return (
    <section className="page">
      <PageHeader title="System" description="Runtime checks for API, PostgreSQL, Redis, and metrics." />
      <div className="stats-grid">
        <StatCard label="API" value={<StatusBadge status={health.data?.status === 'ok' ? 'ACTIVE' : 'FAILED'} />} detail={apiBaseUrl} icon={<Server size={20} />} />
        <StatCard label="Readiness" value={ready.data?.status ?? 'unknown'} detail="Dependency aggregate" icon={<Activity size={20} />} />
        <StatCard label="PostgreSQL" value={ready.data?.services.database ?? 'unknown'} detail="Database connection" icon={<Database size={20} />} />
        <StatCard label="Redis" value={ready.data?.services.redis ?? 'unknown'} detail="Queue backend" icon={<Waves size={20} />} />
      </div>
      <section className="panel">
        <h2>Ready response</h2>
        <JsonBlock value={ready.data} />
      </section>
      <section className="panel">
        <h2>Metrics</h2>
        <pre className="json-block metrics-block">{metrics.data ?? 'Metrics unavailable'}</pre>
      </section>
    </section>
  );
}
