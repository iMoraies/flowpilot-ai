import { ArrowRight } from 'lucide-react';
import type { WorkflowStep } from '../types/api';

export function WorkflowDiagram({ steps }: { steps: WorkflowStep[] }) {
  if (steps.length === 0) {
    return <div className="diagram-empty">No steps defined</div>;
  }

  return (
    <div className="workflow-diagram" aria-label="Workflow step diagram">
      {steps.map((step, index) => (
        <div className="diagram-node-group" key={step.id}>
          <div className="diagram-node">
            <span>{step.position}</span>
            <strong>{step.name}</strong>
            <small>{step.type.replaceAll('_', ' ')}</small>
          </div>
          {index < steps.length - 1 ? <ArrowRight className="diagram-arrow" size={22} /> : null}
        </div>
      ))}
    </div>
  );
}
