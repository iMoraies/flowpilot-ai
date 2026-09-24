const toneByStatus: Record<string, string> = {
  ACTIVE: 'green',
  SUCCESS: 'green',
  DONE: 'green',
  RUNNING: 'blue',
  IN_PROGRESS: 'blue',
  PENDING: 'amber',
  OPEN: 'amber',
  DRAFT: 'gray',
  INACTIVE: 'gray',
  SKIPPED: 'gray',
  FAILED: 'red',
  CANCELLED: 'red',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge ${toneByStatus[status] ?? 'gray'}`}>{status.replaceAll('_', ' ')}</span>;
}
