import { describe, expect, it } from 'vitest';
import { parseConfiguration } from './workflowForms';

describe('parseConfiguration', () => {
  it('accepts JSON objects', () => {
    expect(parseConfiguration('{"message":"hello"}')).toEqual({ message: 'hello' });
  });

  it('rejects non-object JSON', () => {
    expect(() => parseConfiguration('["bad"]')).toThrow('Configuration must be a JSON object.');
  });
});
