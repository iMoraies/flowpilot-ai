# FlowPilot AI

FlowPilot AI is a professional portfolio project for business process automation. The long-term goal is to model workflows that combine manual steps, queues, external integrations, AI classification, tasks, notifications, auditability, and observability.

The current status includes the technical foundation plus authentication, refresh-token sessions, RBAC, and organization isolation. Workflow CRUD, workflow execution, real AI providers, HTTP integrations, tasks, and notifications are intentionally not implemented yet.

## Stack

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ
- Docker and Docker Compose
- Vitest
- Zod
- OpenAPI / Swagger

## Architecture

The project starts as a modular monolith. The API, infrastructure, jobs, shared utilities, and future domain modules live in one deployable application, while the folder structure keeps boundaries visible from the beginning.

```text
src/
  modules/
  shared/
  infrastructure/
  config/
  jobs/
```

## Authentication

Available endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:id/role`

Roles:

- `ADMIN`: can manage users.
- `MANAGER`: can list users in the same organization.
- `MEMBER`: regular authenticated user.

All protected routes derive `organizationId` from the authenticated token.

## Local Requirements

- Node.js 22+
- npm
- Docker and Docker Compose

## Running Locally

Create a local `.env` from the example:

```bash
cp .env.example .env
```

Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

Install dependencies and generate Prisma Client:

```bash
npm install
npm run prisma:generate
```

Run the initial migration:

```bash
npm run prisma:migrate
```

Start the API:

```bash
npm run dev
```

Open Swagger when enabled:

```text
http://localhost:3333/docs
```

Check health:

```text
GET http://localhost:3333/health
```

## Main Commands

- `npm run dev`: run the API in development mode.
- `npm run build`: compile TypeScript.
- `npm start`: run the compiled application.
- `npm run lint`: run ESLint.
- `npm run typecheck`: run TypeScript checks.
- `npm test`: run tests once.
- `npm run test:watch`: run tests in watch mode.
- `npm run prisma:migrate`: run Prisma migrations locally.
- `npm run prisma:generate`: generate Prisma Client.

## Short Roadmap

- Add complete authentication with access and refresh tokens.
- Add durable audit log storage.
- Add workflow definition CRUD.
- Add asynchronous workflow execution with BullMQ.
- Add HTTP request and AI classification steps behind internal contracts.
- Add audit logs and broader observability.
