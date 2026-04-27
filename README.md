# Personal Finance System V1

Full-stack personal finance workspace for the approved V1 plan in
`docs/2026-04-25-personal-finance-system-v1/plan.md`.

The app is split into two packages:

- `frontend/`: React, TypeScript, Vite, Tailwind CSS, shadcn/ui-style
  primitives, TanStack Query, and Feature-Sliced Design.
- `backend/`: Fastify, TypeScript, Zod, MongoDB, httpOnly cookie auth, and
  controller/service/repository domain modules.

Task 21 privacy and data lifecycle work is intentionally still TODO. Do not use
this app with real production personal finance data until export, account
deletion, lifecycle tests, privacy notice, and processor review are completed.

## Requirements

- Node.js 24.15.0, pinned in `.nvmrc`.
- pnpm 10.33.2, pinned in the root `packageManager` field.
- Docker Desktop or another Docker Compose-compatible runtime for local
  MongoDB.

Resolved dependency versions are committed in `pnpm-lock.yaml`. The package
manifests record the direct dependency ranges; the lockfile is the source of
truth for the exact versions used by this workspace.

## Setup

```sh
nvm use
corepack enable
corepack prepare pnpm@10.33.2 --activate
pnpm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` and replace `COOKIE_SECRET` with a local secret of at least
32 characters. Keep real secrets out of git; `.env` files are ignored except for
checked-in `.env.example` files.

The frontend needs `frontend/.env` for local development because the Vite app
and backend run on different origins. The default example sets
`VITE_API_BASE_URL=http://127.0.0.1:3000/api`.

## Local MongoDB

The local MongoDB service runs as a single-node replica set so transactions are
exercised during development and tests.

```sh
docker compose up -d mongodb
```

Default local connection string:

```text
mongodb://localhost:27017/finances?replicaSet=rs0
```

The compose service uses the `mongodb-data` Docker volume. It is intended for
local development only and does not configure production authentication,
backups, retention controls, or encryption policies.

## Run Locally

In one terminal:

```sh
pnpm --filter @finances/backend dev
```

In another terminal:

```sh
pnpm --filter @finances/frontend dev
```

Default URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:3000`
- Backend health check: `http://127.0.0.1:3000/health`

The backend development CORS allowlist includes the Vite origins on
`127.0.0.1:5173` and `localhost:5173`. If you use another frontend origin, add
it to `FRONTEND_ORIGINS` in `backend/.env`.

## Workspace Scripts

```sh
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
pnpm audit
```

- `format`: checks repository formatting with Prettier.
- `lint`: runs each package ESLint config.
- `typecheck`: runs strict TypeScript checks for both apps.
- `test`: runs backend and frontend Vitest suites.
- `build`: compiles the backend and builds the frontend.
- `dev`: starts package dev servers in parallel.
- `audit`: runs `pnpm audit --audit-level moderate`.

Package-specific commands are available through filters, for example:

```sh
pnpm --filter @finances/backend test
pnpm --filter @finances/frontend test:e2e
pnpm --filter @finances/frontend test:e2e:full-stack
pnpm --filter @finances/frontend preview
```

## Environment

Backend variables are documented in `backend/.env.example`.

| Variable                       | Purpose                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `NODE_ENV`                     | `development`, `test`, or `production`.                                                |
| `HOST` / `PORT`                | Fastify listen address, defaulting to `127.0.0.1:3000`.                                |
| `LOG_LEVEL`                    | Console logger level: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, or `silent`. |
| `MONGODB_URI`                  | MongoDB connection string. Local default uses the replica-set compose service.         |
| `COOKIE_SECRET`                | Required 32+ character secret for signed cookies and derived token signatures.         |
| `FRONTEND_ORIGINS`             | Comma-separated exact origins allowed for credentialed CORS.                           |
| `AUTH_RATE_LIMIT_WINDOW_MS`    | Auth rate-limit window in milliseconds.                                                |
| `AUTH_RATE_LIMIT_MAX_ATTEMPTS` | Maximum signup, login, and refresh attempts per window.                                |

In production, the backend rejects the local default MongoDB URI, placeholder
cookie secrets, empty frontend origins, and non-HTTPS frontend origins.

Frontend variables are documented in `frontend/.env.example`.

| Variable            | Purpose                                                                        |
| ------------------- | ------------------------------------------------------------------------------ |
| `VITE_API_BASE_URL` | Browser API base URL. Use `http://127.0.0.1:3000/api` for default local setup. |

## Documentation Map

- `backend/README.md`: backend development, API routes, auth/CSRF behavior,
  data model rules, recurring-tag propagation, finance timezone handling, and
  backend troubleshooting.
- `frontend/README.md`: frontend development, Feature-Sliced Design layers,
  API client behavior, testing, and theme customization.
- `frontend/THEME.md`: detailed theme token guide.
- `docs/2026-04-25-personal-finance-system-v1/prd.md`: approved product
  requirements.
- `docs/2026-04-25-personal-finance-system-v1/plan.md`: approved
  implementation plan.

## Testing

Run the normal quality gate before handing off changes:

```sh
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run Playwright separately when the change touches user workflows, routing,
layout, or critical browser behavior:

```sh
pnpm --filter @finances/frontend test:e2e
```

Run the full-stack browser smoke path when changing auth, API base URL wiring,
cookie/CSRF behavior, or persistence boundaries:

```sh
pnpm --filter @finances/frontend test:e2e:full-stack
```

Backend integration tests use an in-memory MongoDB replica set. In sandboxed
environments, those tests and Playwright may need permission to bind local
ports.

## Troubleshooting

- `Invalid backend environment: COOKIE_SECRET`: copy `backend/.env.example` to
  `backend/.env` and use a 32+ character value.
- `MongoServerSelectionError` or connection refused: start MongoDB with
  `docker compose up -d mongodb` and confirm the URI includes
  `replicaSet=rs0`.
- Transaction errors in local development: recreate the compose service and let
  the healthcheck initialize the single-node replica set.
- Browser requests blocked by CORS: make sure the exact frontend origin is in
  `FRONTEND_ORIGINS`.
- `429` from auth routes: wait for `AUTH_RATE_LIMIT_WINDOW_MS` or adjust the
  local rate-limit settings in `backend/.env`.
- Frontend session looks stale across tabs: refresh the page. The API client
  uses a `BroadcastChannel` for auth state when the browser supports it.
- `pnpm audit` cannot reach the registry: rerun when network access is
  available and you are comfortable sending dependency metadata to the npm
  registry.
