const API_URL = process.env.FLOWPILOT_API_URL ?? 'http://localhost:3333';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} failed: ${response.status} ${await response.text()}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function main(): Promise<void> {
  const login = await request<{ accessToken: string }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@flowpilot.local',
      password: 'demo-password',
    }),
  });

  const auth = { authorization: `Bearer ${login.accessToken}` };
  const workflows = await request<{ data: Array<{ id: string; name: string }> }>('/api/v1/workflows', {
    headers: auth,
  });
  const workflow = workflows.data.find((item) => item.name === 'Support Request Automation');

  if (!workflow) {
    throw new Error('Demo workflow not found. Run npm run prisma:seed first.');
  }

  const execution = await request<{ id: string; status: string }>(
    `/api/v1/workflows/${workflow.id}/executions`,
    {
      method: 'POST',
      headers: {
        ...auth,
        'idempotency-key': `demo-${Date.now()}`,
      },
      body: JSON.stringify({
        input: {
          message: 'Customer has a TECHNICAL problem with login.',
        },
      }),
    },
  );

  console.log(`Execution queued: ${execution.id}`);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const current = await request<{ status: string; steps: unknown[]; tasks: unknown[] }>(
      `/api/v1/executions/${execution.id}`,
      { headers: auth },
    );
    console.log(`Execution status: ${current.status}`);

    if (['SUCCESS', 'FAILED', 'CANCELLED'].includes(current.status)) {
      console.log(JSON.stringify(current, null, 2));
      return;
    }
  }

  throw new Error('Execution did not finish within demo timeout.');
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
