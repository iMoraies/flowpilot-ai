export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';
export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export type WorkflowStepType =
  | 'MANUAL'
  | 'HTTP_REQUEST'
  | 'AI_CLASSIFICATION'
  | 'CONDITION'
  | 'CREATE_TASK'
  | 'NOTIFICATION';
export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type ExecutionStepStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export type User = {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type Organization = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
  organization: Organization;
};

export type WorkflowStep = {
  id: string;
  workflowId: string;
  name: string;
  type: WorkflowStepType;
  configuration: Record<string, unknown>;
  position: number;
  nextStepId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Workflow = {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  status: WorkflowStatus;
  version: number;
  createdBy: string;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
};

export type ExecutionStep = {
  id: string;
  executionId: string;
  workflowStepId: string;
  status: ExecutionStepStatus;
  input: unknown;
  output: unknown | null;
  error: unknown | null;
  attempt: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type Task = {
  id: string;
  organizationId: string;
  executionId: string;
  workflowStepId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

export type Execution = {
  id: string;
  organizationId: string;
  workflowId: string;
  workflowVersion: number;
  workflowSnapshot: unknown;
  status: ExecutionStatus;
  input: unknown;
  output: unknown | null;
  error: unknown | null;
  idempotencyKey?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdBy: string;
  steps?: ExecutionStep[];
  tasks?: Task[];
  createdAt: string;
};

export type AuditLog = {
  id: string;
  organizationId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: unknown | null;
  createdAt: string;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};

export type ReadyStatus = {
  status: 'ok' | 'degraded';
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
};
