---
title: Task 20: Observability, Error Handling, And Hardening
slug: observability-error-handling-and-hardening
type: implementation-task
status: completed
created: 2026-04-26
updated: 2026-04-26
source: plan
plan: plan.md
task: 20
---

Status: completed

# Task 20: Observability, Error Handling, And Hardening

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 20 from Implementation Subtasks.
- Planned execution: sequential after Task 19.
- Dependencies: Tasks 1 through 19. `task_1.md` through `task_19.md` exist and
  mark their tasks completed.

Planned task text:

```text
### 20. Observability, Error Handling, And Hardening

- Add structured backend request logging without sensitive payloads.
- Add structured audit/debug logs for recurring propagation and bulk unlink operations with request id, user id, tag/category id, cutoff instant, affected counts, and no sensitive labels/descriptions/amount payloads.
- Add consistent frontend error toasts or inline errors for failed mutations.
- Add rate limiting or brute-force protection for auth endpoints.
- Add request body size limits.
- Add secure CORS configuration for configured frontend origins.
- Add cookie security settings for dev and production.
- Add dependency audit commands to documentation and quality gates.
```

Human adjustment for this task:

```text
- For now, do not integrate any robust logging platform such as Datadog, Sentry, or similar tools.
- You may proceed with implementing the logging layer with methods such as audit, debug, warn, error, etc.
- At this stage, the logging layer should only output through console.log.
```

## Implementation Summary

- Implemented sequentially as requested for Task 20.
- Replaced the previous Fastify/Pino logger setup with a local app logging layer
  exposing `audit`, `debug`, `info`, `warn`, `error`, `fatal`, and `trace`
  methods. The default logger writes structured JSON lines only through
  `console.log`, suppresses default output in tests, and redacts sensitive key
  fragments such as tokens, cookies, passwords, labels, descriptions, and
  amounts.
- Did not add Datadog, Sentry, hosted logging, hosted error reporting, analytics,
  or any similar provider. Removed the now-unused `pino-pretty` dev dependency
  and updated the lockfile.
- Added backend request completion logging with request id, route path, method,
  status code, duration, and user id when authenticated. Request and response
  payloads are not logged.
- Moved backend error-handler logging onto the new app logger while preserving
  safe HTTP error responses with request ids.
- Added audit logs for category bulk unlink, recurring-tag bulk unlink, and
  recurring-tag amount propagation. Audit context includes request id, user id,
  category/tag id, cutoff or unlink instant, affected record count, affected
  value count, and skipped past value count where applicable. It intentionally
  omits finance labels, descriptions, and amount payloads.
- Added exact-origin credentialed CORS handling from `FRONTEND_ORIGINS`, with
  development defaults for the Vite origins and no wildcard origin support.
- Added in-memory brute-force protection for public auth routes
  (`signup`, `login`, and `refresh`) with `Retry-After` responses and hashed IP
  logging on limit hits.
- Kept the existing 256 KB Fastify body size limit and added explicit coverage.
- Kept auth cookies httpOnly, SameSite=Lax, signed, host-prefixed, `Path=/`, and
  Secure in production. Documentation now calls out the local-development
  Secure exception.
- Added a shared frontend API error-message helper and wired existing inline
  mutation/query errors through it for consistent fallback behavior without
  adding a toast dependency.
- Documented the console-only logging posture, CORS settings, auth rate-limit
  settings, cookie security posture, and audit command in the README and
  `.env.example`.

## Changed Files

- `backend/src/shared/logger.ts`: adds the console-only structured app logging
  layer and redaction.
- `backend/src/shared/logger.test.ts`: covers console output, audit log shape,
  redaction, and test-mode suppression.
- `backend/src/middleware/request-logging.ts`: adds structured request
  completion logging.
- `backend/src/middleware/error-handler.ts`: routes handled and unhandled error
  logs through the app logger.
- `backend/src/middleware/cors.ts`: adds configured exact-origin credentialed
  CORS handling and preflight responses.
- `backend/src/middleware/rate-limit.ts`: adds in-memory auth rate limiting with
  retry headers and privacy-preserving hashed IP logging.
- `backend/src/app.ts`: wires the app logger, request logging, CORS, error
  logging, body limit, and Fastify logger disabling.
- `backend/src/server.ts`: logs server lifecycle events through the app logger.
- `backend/src/config/env.ts` and `backend/src/config/env.test.ts`: add
  `FRONTEND_ORIGINS`, `AUTH_RATE_LIMIT_WINDOW_MS`, and
  `AUTH_RATE_LIMIT_MAX_ATTEMPTS`.
- `backend/src/modules/auth/auth.routes.ts` and
  `backend/src/modules/auth/auth.test.ts`: apply and test auth rate limiting.
- `backend/src/modules/categories/*`: pass request ids into category delete,
  return unlink counts from the repository, and audit category bulk unlink.
- `backend/src/modules/recurring-tags/*`: pass request ids into recurring-tag
  amount/delete mutations, return unlink counts, and audit propagation/unlink.
- `backend/src/app.test.ts`: covers request logging, configured CORS, and body
  size limiting.
- `backend/.env.example`: documents new CORS and auth rate-limit environment
  variables.
- `backend/package.json` and `pnpm-lock.yaml`: remove the unused `pino-pretty`
  dependency after switching to console-only logging.
- `frontend/src/shared/api/errors.ts` and
  `frontend/src/shared/api/errors.test.ts`: add the shared API error fallback
  helper.
- `frontend/src/pages/login/index.tsx`, `frontend/src/pages/sign-up/index.tsx`,
  `frontend/src/pages/home/index.tsx`, `frontend/src/pages/monthly/index.tsx`,
  `frontend/src/features/categories/ui/category-manager.tsx`,
  `frontend/src/features/records/ui/record-workspace.tsx`, and
  `frontend/src/features/recurring-tags/ui/recurring-tag-value-editor.tsx`:
  route existing inline errors through the shared helper.
- `README.md`: documents logging scope, CORS, auth rate limits, cookie security,
  and the audit command.
- `docs/2026-04-25-personal-finance-system-v1/task_20.md`: records this
  subtask's implementation progress.

## Tests / Verification

- Focused backend tests:
  - Sandbox command:
    `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend test -- src/app.test.ts src/config/env.test.ts src/shared/logger.test.ts src/modules/auth/auth.test.ts src/modules/categories/categories.test.ts src/modules/recurring-tags/recurring-tags.test.ts`
  - Result: the command expanded into the broader backend suite and failed where
    `mongodb-memory-server` needed to bind local ports, with
    `listen EPERM: operation not permitted 0.0.0.0`.
  - Escalated rerun with pinned Node 24:
    `/usr/bin/env PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH pnpm --filter @finances/backend exec vitest run src/app.test.ts src/config/env.test.ts src/shared/logger.test.ts src/modules/auth/auth.test.ts src/modules/categories/categories.test.ts src/modules/recurring-tags/recurring-tags.test.ts`
  - Result: passed, 6 backend test files and 28 tests.
- Focused frontend helper test:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend test -- src/shared/api/errors.test.ts`
  - Result: passed as part of the frontend Vitest run, 13 frontend test files
    and 26 tests.
- Final logger-focused rerun after serializer hardening:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/shared/logger.test.ts`
  - Result: passed, 1 backend test file and 2 tests.
- Lockfile update after removing unused pretty logging dependency:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm install --lockfile-only`
  - Result: completed and updated `pnpm-lock.yaml`. The sandbox printed npm
    registry DNS `ENOTFOUND` warnings while resolving metadata, but the command
    exited successfully.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: initially reported formatting in two repository files. Targeted
    Prettier formatting was applied, then rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: initially failed on strict TypeScript ESLint issues in new tests and
    middleware. The unsafe test matchers, optional context pushes, CORS origin
    parsing, and synchronous request logging hook were corrected, then rerun
    passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: initially failed on `exactOptionalPropertyTypes` in test logger
    capture helpers. The helpers were corrected, then rerun passed for backend
    and frontend.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
    Vite reported the existing non-failing bundle chunk-size warning.
  - `/usr/bin/env PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH pnpm test`
  - Result: escalated rerun passed, backend 14 test files and 52 tests; frontend
    13 test files and 26 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend test:e2e`
  - Result: sandbox run failed with `listen EPERM` on `127.0.0.1:4173`.
  - `/usr/bin/env PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH pnpm --filter @finances/frontend test:e2e`
  - Result: escalated rerun passed, 14 Playwright tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm audit --audit-level moderate`
  - Result: sandbox run failed with npm registry DNS `ENOTFOUND`.
  - Escalated audit rerun request:
    `/usr/bin/env PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH pnpm audit --audit-level moderate`
  - Result: rejected by the approval reviewer because `pnpm audit` would send
    workspace dependency metadata to the external npm registry and the human had
    not explicitly approved that disclosure for this task. No workaround was
    attempted.
- Source-driven checks:
  - Used the approved Task 20 plan text as the implementation source.
  - Reused existing Fastify hooks, request id middleware, shared error mapper,
    auth route structure, repository transaction patterns, React inline error
    UI, and existing test harnesses.

## Deviations / Follow-Ups

- Human-approved adjustment: no robust logging platform such as Datadog, Sentry,
  hosted log drains, hosted error reporting, or similar tooling was added.
  Logging is intentionally limited to the local app logger and `console.log`
  output for now.
- Implementation detail: auth brute-force protection is in-memory and
  process-local. This satisfies V1 local hardening, but a production
  horizontally scaled deployment should move auth rate limiting to shared
  infrastructure such as the API gateway, reverse proxy, Redis, or another
  centralized store.
- Follow-up: `pnpm audit --audit-level moderate` still requires explicit human
  approval before dependency metadata can be sent to the npm registry from this
  environment.
- Follow-up: Vite's production build still emits the existing non-failing
  chunk-size warning. This remains suitable for Task 23 final integration and
  polish unless bundle splitting becomes a release requirement earlier.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Created after completing Task 20 and recording the human logging
  adjustment, implementation details, focused tests, full quality gate results,
  audit rejection, and follow-up scope.
- 2026-04-26: Added final verification note after rerunning format, lint,
  typecheck, and the logger unit test following logger serializer hardening.

## Next Task

- Recommended next planned task: Task 21, Privacy And Data Lifecycle.
