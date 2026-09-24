import { getByPath } from './context';

export type ConditionOperator = 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists';

export type ConditionConfig = {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
  onTrue: string;
  onFalse?: string;
};

export function evaluateCondition(data: Record<string, unknown>, condition: ConditionConfig): boolean {
  const actual = getByPath(data, condition.field);

  switch (condition.operator) {
    case 'equals':
      return actual === condition.value;
    case 'notEquals':
      return actual !== condition.value;
    case 'contains':
      return typeof actual === 'string' && typeof condition.value === 'string'
        ? actual.includes(condition.value)
        : Array.isArray(actual) && actual.includes(condition.value);
    case 'greaterThan':
      return typeof actual === 'number' && typeof condition.value === 'number' && actual > condition.value;
    case 'lessThan':
      return typeof actual === 'number' && typeof condition.value === 'number' && actual < condition.value;
    case 'exists':
      return actual !== undefined && actual !== null;
  }
}
