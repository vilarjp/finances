---
title: Task 7: Authentication Backend
slug: authentication-backend
type: implementation-task
status: completed
created: 2026-04-26
updated: 2026-04-26
source: plan
plan: plan.md
task: 7
---

Status: completed

# Task 7: Authentication Backend

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 7 from Implementation Subtasks.
- Planned execution: sequential after Task 6.
- Dependencies: Tasks 1, 2, 3, 4, 5, and 6. `task_3.md`, `task_4.md`, `task_5.md`, and `task_6.md` exist and mark their tasks completed. No `task_1.md` or `task_2.md` progress documents existed, but the repository already contained the workspace and frontend scaffold those tasks established.

Planned task text:

```text
### 7. Authentication Backend

- Implement sign-up, login, logout, refresh, and current-user endpoints.
- Hash passwords with Argon2id unless ecosystem constraints require a documented alternative.
- Store refresh token hashes, rotate refresh tokens, and clear cookies on logout.
- Implement the CSRF flow, cookie settings, refresh-token family tracking, refresh replay detection, and multi-tab refresh expectations from the auth/session contract.
- Add auth middleware that populates request user context.
- Ensure duplicate email, invalid credentials, expired refresh, and revoked refresh cases are covered.
- Add integration tests for auth success/failure paths, CSRF rejection, refresh replay, concurrent refresh behavior, logout revocation, and finance-data scoping guardrails.
```

## Implementation Summary

- Added the backend auth module with controller, service, repository, routes, schemas, cookie helpers, token helpers, middleware, constants, and integration tests.
- Implemented `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`, `GET /api/auth/csrf`, and `GET /api/auth/me`.
- Added Argon2id password hashing through `@node-rs/argon2`, using its default Argon2id algorithm verified from the installed package docs.
- Added signed httpOnly auth cookies, HMAC-backed access tokens, HMAC-hashed refresh tokens, and signed CSRF tokens bound to the current access-token CSRF secret.
- Required `COOKIE_SECRET` in every backend environment so cookie signing and auth token signatures are always backed by an environment-provided secret.
- Added refresh token family tracking, MongoDB transaction-backed refresh rotation, replay detection that revokes the token family, and a short concurrent-refresh grace path that returns `409 REFRESH_TOKEN_ALREADY_ROTATED` without revoking the winning token family.
- Added auth middleware decorators that populate `request.user` from the access cookie and validate CSRF on authenticated mutating routes.
- Wired auth routes into app startup when the database connection is available and kept `database: false` test apps available for non-database tests.
- Implemented sequentially as requested for Task 7.

## Changed Files

- `README.md`: documented the required cookie secret and backend auth endpoints/cookie behavior.
- `backend/src/app.ts`: registered signed cookies with the required secret and mounted auth routes under `/api/auth` when a database is available.
- `backend/src/app.test.ts`: supplied the required test cookie secret.
- `backend/src/app.database.test.ts`: supplied the required test cookie secret.
- `backend/src/config/env.ts`: made `COOKIE_SECRET` required in every environment.
- `backend/src/config/env.test.ts`: updated environment validation coverage for the required cookie secret.
- `backend/src/modules/auth/auth.constants.ts`: added auth cookie names, CSRF header name, and auth durations.
- `backend/src/modules/auth/auth.controller.ts`: added route handlers for sign-up, login, logout, refresh, CSRF, and current user.
- `backend/src/modules/auth/auth.cookies.ts`: added signed auth cookie setting, clearing, and reading helpers.
- `backend/src/modules/auth/auth.middleware.ts`: added Fastify auth and CSRF preHandler decorators.
- `backend/src/modules/auth/auth.repository.ts`: added user and refresh-token persistence, rotation, lookup, and family revocation.
- `backend/src/modules/auth/auth.routes.ts`: registered auth endpoints with controller/service/repository wiring.
- `backend/src/modules/auth/auth.schemas.ts`: added auth request validation, email normalization, and safe user DTO mapping.
- `backend/src/modules/auth/auth.service.ts`: added auth business rules for sign-up, login, refresh, logout, access-token authentication, CSRF, replay detection, and concurrent refresh behavior.
- `backend/src/modules/auth/auth.test.ts`: added integration tests for the planned auth success and failure paths.
- `backend/src/modules/auth/auth.tokens.ts`: added access, refresh-hash, random-token, and CSRF token helpers.
- `docs/2026-04-25-personal-finance-system-v1/task_7.md`: recorded this subtask's implementation progress.

## Tests / Verification

- Existing harness check before adding auth tests:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run test -- app.database`
  - Result: failed in the sandbox with `listen EPERM: operation not permitted 0.0.0.0`.
  - Escalated rerun result: passed, backend 8 test files and 22 tests.
- Focused TDD red-step command:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run test -- auth`
  - Result: failed as expected because auth routes and middleware did not exist yet; the new tests received 404s or missing response data.
- Focused implementation test commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/modules/auth/auth.test.ts -t "rejects missing CSRF"`
  - Result: passed, 1 selected test and 8 skipped.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run test -- auth`
  - Result: passed, backend 9 test files and 31 tests.
- Focused backend checks:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run lint`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run typecheck`
  - Result: passed.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: passed after targeted Prettier formatting of three new auth files.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm test`
  - Result: passed with approved escalation for localhost binding; backend 9 test files and 31 tests, frontend 3 test files and 4 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm audit --audit-level moderate`
  - Result: initial sandbox run failed with npm registry DNS `ENOTFOUND`; escalated rerun passed with no known vulnerabilities.
- External/source-driven checks:
  - Verified from installed `@node-rs/argon2` docs that the default algorithm is Argon2id.
  - Verified from installed `@fastify/cookie` docs and types that signed `setCookie`, `clearCookie`, and `unsignCookie` are the intended APIs.
  - Verified from installed Fastify types that preHandler hooks must be callback-style or async-promise style; the CSRF hook uses callback style so valid CSRF requests advance correctly.
  - Verified from MDN cookie documentation that `__Host-` cookies require `Path=/`, no `Domain`, and `Secure` in conforming browsers.

## Deviations / Follow-Ups

- Approved deviation: the plan's auth/session contract named `__Host-finance_access` and `__Host-finance_refresh` but specified `Path=/api` and `Path=/api/auth`. MDN documents that `__Host-` cookies require `Path=/`, so the human approved keeping the `__Host-*` names and changing both auth cookies to `Path=/`.
- Implementation detail: concurrent refresh reuse inside a 10-second window returns `409 REFRESH_TOKEN_ALREADY_ROTATED` without revoking the winning token family. Older stale-token replay still revokes the full token family. This supports the plan's multi-tab refresh expectations while preserving replay detection.
- Follow-up: Task 8 should have the frontend call `/api/auth/csrf` after login/sign-up/refresh, send `X-CSRF-Token` on authenticated mutating requests, and implement the planned single-flight or cross-tab refresh coordination.

## Blocking Questions

- Status: answered
  Question: The plan names `__Host-finance_access` and `__Host-finance_refresh` but also gives `Path=/api` and `Path=/api/auth`; should we keep the planned `__Host-*` names and change both cookie paths to `Path=/`?
  Answer: Human answered on 2026-04-26: "ok, proceed with your recommendation"
  Task impact: Implemented both auth cookies with `Path=/`, recorded this as an approved deviation, and kept the stronger `__Host-*` cookie names.

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Raised and answered the cookie-prefix blocking question; recorded the approved move to `Path=/`.
- 2026-04-26: Created after completing Task 7 and recording implementation, verification, and approved deviation details.

## Next Task

- Recommended next planned task: Task 8, Authentication Frontend.
