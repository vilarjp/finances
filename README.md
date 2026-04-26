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

## Frontend Theme

Theme tokens are centralized in `frontend/src/app/styles/theme.css`. See
`frontend/THEME.md` for changing the light/dark palette, font family, border
radius, finance colors, chart colors, and shadcn/Tailwind mappings.

## Backend

The backend scaffold lives in `backend/` and uses Fastify, TypeScript, Zod, and
the official MongoDB driver. Copy `backend/.env.example` to `backend/.env` for
local overrides; the default MongoDB URI matches the local replica-set compose
service above.
Backend startup connects to `MONGODB_URI`, creates the planned collection
indexes, and closes the MongoDB client during Fastify shutdown. Backend
integration tests use an in-memory single-node replica set.
`COOKIE_SECRET` is required in every environment because auth cookies are signed
and access, refresh, and CSRF token signatures are derived from that secret.
`FRONTEND_ORIGINS` is a comma-separated allowlist used for credentialed CORS;
development defaults allow the Vite origins on `127.0.0.1:5173` and
`localhost:5173`. `AUTH_RATE_LIMIT_WINDOW_MS` and
`AUTH_RATE_LIMIT_MAX_ATTEMPTS` control the in-memory brute-force protection on
public auth endpoints.

Backend observability intentionally stays local for now. The app uses a small
structured logging layer with `audit`, `debug`, `info`, `warn`, and `error`
methods that writes JSON lines through `console.log`; no Datadog, Sentry, hosted
log drain, or similar provider is integrated. Request logs omit request and
response payloads. Audit logs for recurring propagation and category/tag bulk
unlink operations include request id, user id, object ids, cutoff/unlink
instants, and affected counts, without finance labels, descriptions, or amounts.

Auth endpoints are mounted under `/api/auth`:

- `POST /signup`
- `POST /login`
- `POST /logout`
- `POST /refresh`
- `GET /csrf`
- `GET /me`

The auth cookies use the approved `__Host-finance_access` and
`__Host-finance_refresh` names with `Path=/`, httpOnly, SameSite=Lax, and Secure
in production. Development keeps `Secure` off so local HTTP testing works; use
HTTPS and production mode outside local development.

```sh
pnpm --filter @finances/backend dev
pnpm --filter @finances/backend test
pnpm audit --audit-level moderate
```

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
