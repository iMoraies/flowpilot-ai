import type {
  AuditLog,
  AuthResponse,
  Execution,
  ExecutionStatus,
  PaginatedResult,
  ReadyStatus,
  Task,
  TaskStatus,
  User,
  Workflow,
  WorkflowStep,
  WorkflowStepType,
} from '../types/api';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStore';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';
const apiPrefix = `${apiBaseUrl.replace(/\/$/, '')}/api/v1`;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

type RequestOptions = RequestInit & {
  skipAuthRefresh?: boolean;
};

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === 'object' && body && 'error' in body
        ? String((body as { error: { message?: string } }).error.message ?? 'Request failed')
        : String(body || 'Request failed');
    const code =
      typeof body === 'object' && body && 'error' in body
        ? String((body as { error: { code?: string } }).error.code ?? '')
        : undefined;
    throw new ApiError(message, response.status, code);
  }

  return body as T;
}

async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  const response = await fetch(`${apiPrefix}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    return false;
  }

  const refreshed = await response.json() as AuthResponse;
  setTokens({ accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken });
  return true;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiPrefix}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !options.skipAuthRefresh && await refreshSession()) {
    return apiRequest<T>(path, { ...options, skipAuthRefresh: true });
  }

  return parseResponse<T>(response);
}

export const api = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuthRefresh: true,
    }),
  me: () => apiRequest<User>('/auth/me'),
  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiRequest<void>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        skipAuthRefresh: true,
      }).catch(() => undefined);
    }
    clearTokens();
  },
  listWorkflows: () => apiRequest<PaginatedResult<Workflow>>('/workflows?limit=100'),
  getWorkflow: (id: string) => apiRequest<Workflow>(`/workflows/${id}`),
  createWorkflow: (input: { name: string; description?: string }) =>
    apiRequest<Workflow>('/workflows', { method: 'POST', body: JSON.stringify(input) }),
  updateWorkflow: (id: string, input: { name?: string; description?: string }) =>
    apiRequest<Workflow>(`/workflows/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  activateWorkflow: (id: string) => apiRequest<Workflow>(`/workflows/${id}/activate`, { method: 'POST' }),
  deactivateWorkflow: (id: string) => apiRequest<Workflow>(`/workflows/${id}/deactivate`, { method: 'POST' }),
  addStep: (workflowId: string, input: { name: string; type: WorkflowStepType; configuration: Record<string, unknown>; position: number; nextStepId?: string | null }) =>
    apiRequest<WorkflowStep>(`/workflows/${workflowId}/steps`, { method: 'POST', body: JSON.stringify(input) }),
  updateStep: (workflowId: string, stepId: string, input: Partial<{ name: string; type: WorkflowStepType; configuration: Record<string, unknown>; position: number; nextStepId: string | null }>) =>
    apiRequest<WorkflowStep>(`/workflows/${workflowId}/steps/${stepId}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteStep: (workflowId: string, stepId: string) =>
    apiRequest<void>(`/workflows/${workflowId}/steps/${stepId}`, { method: 'DELETE' }),
  runWorkflow: (workflowId: string, input: Record<string, unknown>) =>
    apiRequest<Execution>(`/workflows/${workflowId}/executions`, {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ input }),
    }),
  listExecutions: (filters: { workflowId?: string; status?: ExecutionStatus } = {}) => {
    const params = new URLSearchParams({ limit: '100' });
    if (filters.workflowId) params.set('workflowId', filters.workflowId);
    if (filters.status) params.set('status', filters.status);
    return apiRequest<PaginatedResult<Execution>>(`/executions?${params.toString()}`);
  },
  getExecution: (id: string) => apiRequest<Execution>(`/executions/${id}`),
  listTasks: (status?: TaskStatus) => apiRequest<PaginatedResult<Task>>(`/tasks?limit=100${status ? `&status=${status}` : ''}`),
  updateTask: (id: string, status: TaskStatus) =>
    apiRequest<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  listAuditLogs: () => apiRequest<PaginatedResult<AuditLog>>('/audit-logs?limit=100'),
  ready: () => fetch(`${apiBaseUrl.replace(/\/$/, '')}/ready`).then((response) => parseResponse<ReadyStatus>(response)),
  health: () => fetch(`${apiBaseUrl.replace(/\/$/, '')}/health`).then((response) => parseResponse<{ status: string }>(response)),
  metrics: () => fetch(`${apiBaseUrl.replace(/\/$/, '')}/metrics`).then((response) => response.text()),
};

export { apiBaseUrl };
