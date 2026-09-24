import { trace } from '@opentelemetry/api';
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';

let initialized = false;

export function initializeTracing(): void {
  if (initialized) {
    return;
  }

  const provider = new BasicTracerProvider();
  trace.setGlobalTracerProvider(provider);
  initialized = true;
}

export function getTracer() {
  return trace.getTracer('flowpilot-ai');
}
