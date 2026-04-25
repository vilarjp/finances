# Personal Finance System V1

Greenfield full-stack workspace for the Personal Finance System V1 plan.

## Requirements

- Node.js 24.15.0, the current Active LTS release pinned in `.nvmrc`.
- pnpm 10.33.2, pinned through the root `packageManager` field.
- Docker Desktop or another Docker Compose-compatible runtime for local MongoDB.

## Setup

```sh
nvm use
corepack enable
corepack prepare pnpm@10.33.2 --activate
pnpm install
```

## Local MongoDB

The local MongoDB service is configured as a single-node replica set so backend
transactions can be exercised during development.

```sh
docker compose up -d mongodb
```

The default local connection string is:

```text
mongodb://localhost:27017/finances?replicaSet=rs0
```

This compose service is for local development only and does not enable
production-grade authentication, backups, or retention controls.

## Workspace Scripts

```sh
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

`lint`, `typecheck`, `test`, `build`, and `dev` delegate to workspace packages
when `frontend/` and `backend/` are scaffolded. `format` checks repository files
with the shared Prettier configuration.

## Project Layout

```text
.
├── backend/
├── docs/
├── frontend/
├── compose.yaml
├── package.json
└── pnpm-workspace.yaml
```

Application source will live under `frontend/` and `backend/`. Planning and
product documents remain under `docs/`.
