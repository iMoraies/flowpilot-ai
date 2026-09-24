import { describe, expect, it } from 'vitest';
import { evaluateCondition } from '../../src/modules/executions/condition-evaluator';

describe('condition evaluator', () => {
  it('evaluates supported operators without eval', () => {
    const data = {
      classification: 'TECHNICAL',
      score: 8,
      tags: ['urgent', 'vip'],
    };

    expect(evaluateCondition(data, { field: 'classification', operator: 'equals', value: 'TECHNICAL', onTrue: 'a' })).toBe(true);
    expect(evaluateCondition(data, { field: 'classification', operator: 'notEquals', value: 'BILLING', onTrue: 'a' })).toBe(true);
    expect(evaluateCondition(data, { field: 'tags', operator: 'contains', value: 'vip', onTrue: 'a' })).toBe(true);
    expect(evaluateCondition(data, { field: 'score', operator: 'greaterThan', value: 5, onTrue: 'a' })).toBe(true);
    expect(evaluateCondition(data, { field: 'score', operator: 'lessThan', value: 10, onTrue: 'a' })).toBe(true);
    expect(evaluateCondition(data, { field: 'classification', operator: 'exists', onTrue: 'a' })).toBe(true);
  });
});
