---
title: Task 8: Authentication Frontend
slug: authentication-frontend
type: implementation-task
status: completed
created: 2026-04-26
updated: 2026-04-26
source: plan
plan: plan.md
task: 8
---

Status: completed

# Task 8: Authentication Frontend

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 8 from Implementation Subtasks.
- Planned execution: sequential after Task 7.
- Dependencies: Tasks 1, 2, 3, 4, 5, 6, and 7. `task_3.md`, `task_4.md`, `task_5.md`, `task_6.md`, and `task_7.md` exist and mark their tasks completed. No `task_1.md` or `task_2.md` progress documents existed, but the repository already contained the workspace and frontend scaffold those tasks established.

Planned task text:

```text
### 8. Authentication Frontend

- Build sign-up and login pages with accessible shadcn/ui forms.
- Add auth API client, TanStack Query auth bootstrap, protected route handling, logout action, and redirect behavior.
- Add mobile and desktop layout checks for auth screens.
- Add tests for form validation, success navigation, and failed login messaging.
```

## Implementation Summary

- Replaced placeholder login and sign-up pages with accessible React Hook Form + Zod forms styled with the existing shadcn/Tailwind token surface.
- Added an auth feature slice with login, sign-up, logout, form schemas, and redirect-path sanitization.
- Extended the shared API client with JSON POST support, backend error mapping, CSRF token fetching, `X-CSRF-Token` handling for mutating requests, refresh retry behavior, single-flight refresh coordination, and BroadcastChannel session notifications when available.
- Updated current-user bootstrap to fetch CSRF for authenticated sessions and clear in-memory auth state when no session is present.
- Added protected home routing, public-only auth routes, success redirects, signed-in public-route redirects, and a navigation logout action.
- Added a small shared `Input` primitive matching the existing shadcn-style `Button` pattern.
- Added unit/component tests for route protection, login validation, failed login messaging, login success navigation, sign-up validation, sign-up success navigation, CSRF headers, and single-flight refresh.
- Added Playwright checks for login/sign-up mobile and desktop layout overflow.
- Implemented sequentially as requested for Task 8.

## Changed Files

- `frontend/src/shared/api/http-client.ts`: added API POST support, structured API errors, CSRF handling, refresh retry, single-flight refresh, and BroadcastChannel session notifications.
- `frontend/src/features/auth/api/auth-api.ts`: added login, sign-up, and logout API actions.
- `frontend/src/features/auth/model/forms.ts`: added Zod login and sign-up form schemas.
- `frontend/src/features/auth/lib/redirect.ts`: added safe post-login redirect resolution.
- `frontend/src/features/auth/index.ts`: exported auth feature APIs and types.
- `frontend/src/shared/ui/input.tsx`: added shared input styling.
- `frontend/src/entities/user/api/current-user.ts`: added current-user query key, CSRF bootstrap, and session clearing on unauthenticated bootstrap.
- `frontend/src/entities/user/index.ts`: exported the current-user query key.
- `frontend/src/app/providers/auth-provider.tsx`: reused the shared current-user query key.
- `frontend/src/app/router.tsx`: added protected/public route guards and logout-aware navigation.
- `frontend/src/pages/login/index.tsx`: implemented the login form and success/error behavior.
- `frontend/src/pages/sign-up/index.tsx`: implemented the sign-up form and success/error behavior.
- `frontend/src/app/app.test.tsx`: updated route protection and signed-in redirect coverage.
- `frontend/src/pages/login/login-page.test.tsx`: added login validation, failed login, and success navigation tests.
- `frontend/src/pages/sign-up/sign-up-page.test.tsx`: added sign-up validation and success navigation tests.
- `frontend/src/shared/api/http-client.test.ts`: added CSRF header and single-flight refresh tests.
- `frontend/src/shared/testing/setup-tests.ts`: clears in-memory API session state between tests.
- `frontend/src/shared/testing/test-server.ts`: added default CSRF/logout handlers for frontend tests.
- `frontend/src/shared/testing/e2e/app.spec.ts`: updated shell expectation and added mobile/desktop auth layout checks.
- `docs/2026-04-25-personal-finance-system-v1/task_8.md`: recorded this subtask's implementation progress.

## Tests / Verification

- Existing harness check before adding auth tests:
  - `corepack pnpm --filter @finances/frontend run test`
  - Result: failed because the shell's default Node was `v18.20.3`, below the repository's required Node `24.15.0`; Vitest startup failed on a newer `node:util` export.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run test`
  - Result: passed, frontend 3 test files and 4 tests.
- Focused TDD red-step command:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/pages/login/login-page.test.tsx src/pages/sign-up/sign-up-page.test.tsx src/app/app.test.tsx`
  - Result: failed as expected because the app still had placeholder auth pages, no form fields, and no protected/public route guards.
- Focused implementation test commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/pages/login/login-page.test.tsx src/pages/sign-up/sign-up-page.test.tsx src/app/app.test.tsx`
  - Result: passed, 3 test files and 7 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/shared/api/http-client.test.ts src/pages/login/login-page.test.tsx src/pages/sign-up/sign-up-page.test.tsx src/app/app.test.tsx`
  - Result: passed, 4 test files and 9 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run test`
  - Result: passed, frontend 6 test files and 12 tests.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: initially reported formatting issues in three changed frontend files; targeted Prettier formatting was applied, then the rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm test`
  - Result: initial sandbox run failed with `listen EPERM: operation not permitted 0.0.0.0` from MongoDB memory-server port binding; escalated rerun passed with backend 9 test files and 31 tests, frontend 6 test files and 12 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run test:e2e`
  - Result: initial sandbox run failed with `listen EPERM: operation not permitted 127.0.0.1:4173` while starting the local preview server; escalated rerun passed, 3 Playwright tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm audit --audit-level moderate`
  - Result: sandbox run failed with npm registry DNS `ENOTFOUND`; escalation was rejected because `pnpm audit` sends dependency metadata to the external npm registry and the human has not explicitly approved that disclosure for this task.
- Source-driven checks:
  - Used the repository's installed React Router, TanStack Query, React Hook Form, Zod resolver, MSW, and Playwright packages through TypeScript, lint, component tests, and Playwright checks rather than relying on undocumented behavior.

## Deviations / Follow-Ups

- No material deviations from Task 8.
- Follow-up: Task 9 should implement category CRUD and frontend category UI.
- Follow-up: the current protected home page is still the existing placeholder shell; the planned finance dashboard and authenticated app shell are covered by later Tasks 16 and 18.
- Follow-up: dependency audit remains unavailable until the human explicitly approves sending dependency metadata to the npm registry from this environment.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Created after completing Task 8 and recording implementation, verification, and the unavailable audit check.

## Next Task

- Recommended next planned task: Task 9, Categories Backend And Frontend.
