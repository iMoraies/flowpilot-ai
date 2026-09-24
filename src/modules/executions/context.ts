export type ExecutionContext = {
  input: Record<string, unknown>;
  data: Record<string, unknown>;
};

export function getByPath(source: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, source);
}

export function setByPath(source: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split('.');
  let current = source;

  for (const segment of segments.slice(0, -1)) {
    const next = current[segment];
    if (typeof next !== 'object' || next === null || Array.isArray(next)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }

  current[segments[segments.length - 1]!] = value;
}
