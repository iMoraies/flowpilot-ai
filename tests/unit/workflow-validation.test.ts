import { describe, expect, it } from 'vitest';
import { validateWorkflowForActivation } from '../../src/modules/workflows/workflow.validation';

function step(overrides: Partial<Parameters<typeof validateWorkflowForActivation>[0][number]>) {
  return {
    id: 'step-1',
    name: 'Manual',
    type: 'MANUAL' as const,
    configuration: {},
    nextStepId: null,
    ...overrides,
  };
}

describe('workflow validation', () => {
  it('requires at least one step', () => {
    expect(() => validateWorkflowForActivation([])).toThrow('at least one step');
  });

  it('rejects invalid next step references', () => {
    expect(() => validateWorkflowForActivation([step({ nextStepId: 'missing' })])).toThrow('invalid nextStepId');
  });

  it('validates condition destinations', () => {
    expect(() =>
      validateWorkflowForActivation([
        step({
          type: 'CONDITION',
          configuration: {
            field: 'classification',
            operator: 'equals',
            onTrue: 'missing',
          },
        }),
      ]),
    ).toThrow('invalid onTrue');
  });
});
