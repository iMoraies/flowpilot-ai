export function LoadingState({ label = 'Loading data...' }: { label?: string }) {
  return <div className="state-block">{label}</div>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="state-block">
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <div className="state-block error" role="alert">{message}</div>;
}
