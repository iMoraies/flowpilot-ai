# Contributing

## Setup

```bash
npm install
cp .env.example .env
docker compose up -d postgres redis
npm run prisma:migrate
npm run prisma:seed
```

## Branch Naming

- `feature/<short-name>`
- `fix/<short-name>`
- `docs/<short-name>`

## Commit Convention

Use Conventional Commits:

- `feat(workflows): add activation validation`
- `fix(auth): reject revoked refresh tokens`
- `docs(architecture): explain queue processing`

## Testing

Run before opening a PR:

```bash
npm run lint
npm run typecheck
npm test
npm run coverage
npm run build
```

## PR Expectations

- Keep changes small.
- Include tests for behavior changes.
- Update docs or ADRs when architecture changes.
- Do not commit real secrets.
