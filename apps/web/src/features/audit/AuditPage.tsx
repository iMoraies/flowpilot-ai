import { useQuery } from '@tanstack/react-query';
import { JsonBlock } from '../../components/JsonBlock';
import { PageHeader } from '../../components/PageHeader';
import { ErrorState, LoadingState } from '../../components/StateBlocks';
import { api } from '../../services/apiClient';

export function AuditPage() {
  const audit = useQuery({ queryKey: ['audit-logs'], queryFn: api.listAuditLogs });

  if (audit.isLoading) return <LoadingState />;
  if (audit.isError) return <ErrorState message="Could not load audit logs. Your role may not have access." />;

  return (
    <section className="page">
      <PageHeader title="Audit Logs" description="Security and workflow activity recorded for the organization." />
      <div className="list-stack">
        {audit.data!.data.map((entry) => (
          <details className="detail-row panel-lite" key={entry.id}>
            <summary>
              <strong>{entry.action}</strong>
              <span>{entry.entityType} · {new Date(entry.createdAt).toLocaleString()}</span>
            </summary>
            <JsonBlock value={{ entityId: entry.entityId, actorUserId: entry.actorUserId, metadata: entry.metadata }} />
          </details>
        ))}
      </div>
    </section>
  );
}
