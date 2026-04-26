---
title: Task 9: Categories Backend And Frontend
slug: categories-backend-and-frontend
type: implementation-task
status: completed
created: 2026-04-26
updated: 2026-04-26
source: plan
plan: plan.md
task: 9
---

Status: completed

# Task 9: Categories Backend And Frontend

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 9 from Implementation Subtasks.
- Planned execution: sequential after Task 8.
- Dependencies: Tasks 1, 2, 3, 4, 5, 6, 7, and 8. `task_3.md`, `task_4.md`, `task_5.md`, `task_6.md`, `task_7.md`, and `task_8.md` exist and mark their tasks completed. No `task_1.md` or `task_2.md` progress documents existed, but the repository already contained the workspace and frontend scaffold those tasks established.

Planned task text:

```text
### 9. Categories Backend And Frontend

- Implement category CRUD API with user scoping and unique normalized names.
- On category delete, unlink the category from existing values so those values fall back to the uncategorized grouping without changing their amounts or labels.
- Build category selection, creation, and edit UI that can be used inside record value forms.
- Ensure category color/name changes are reflected anywhere category data is rendered through query invalidation.
- Add unit/integration tests for category validation, uniqueness, authorization, and uncategorized fallback behavior.
```

## Implementation Summary

- Implemented sequentially as requested for Task 9.
- Added authenticated `/api/categories` CRUD routes with CSRF protection for mutating requests.
- Added category controller/service/repository/schema modules using the existing Fastify, MongoDB, Zod, and domain error patterns.
- Moved auth middleware registration to the app root so authenticated sibling API modules can reuse `app.authenticate` and `app.verifyCsrf`.
- Enforced user scoping, normalized-name uniqueness, ObjectId validation, category name limits, and color validation through the backend category module.
- Implemented category delete inside a MongoDB transaction and unlinked matching embedded record values for the authenticated user only, preserving existing value labels and amounts.
- Added frontend category entity/query slices, category API mutations, and reusable `CategorySelect` / `CategoryManager` UI.
- Mounted the category manager on the authenticated home route as the first consuming surface until record editor forms are added in later tasks.
- Added TanStack Query invalidation after create, edit, and delete mutations so rendered category data refreshes after name/color changes.

## Changed Files

- `backend/src/app.ts`: registers root auth middleware and mounts category routes.
- `backend/src/modules/auth/auth.routes.ts`: accepts the root-created auth service instead of registering auth middleware inside the auth route plugin.
- `backend/src/modules/categories/categories.controller.ts`: maps category HTTP requests to service calls and DTO responses.
- `backend/src/modules/categories/categories.repository.ts`: implements scoped category persistence and transactional delete/unlink behavior.
- `backend/src/modules/categories/categories.routes.ts`: registers authenticated category CRUD routes.
- `backend/src/modules/categories/categories.schemas.ts`: validates payloads, ids, normalized names, colors, and category DTO mapping.
- `backend/src/modules/categories/categories.service.ts`: owns category business rules, duplicate-name handling, not-found handling, and delete semantics.
- `backend/src/modules/categories/categories.test.ts`: covers category CRUD, validation, normalized uniqueness, authorization, and unlink-to-uncategorized behavior.
- `frontend/src/entities/category/api/category-queries.ts`: adds category query key, fetcher, and query hook.
- `frontend/src/entities/category/index.ts`: exports category entity APIs and type.
- `frontend/src/entities/category/model/types.ts`: defines the frontend category model.
- `frontend/src/features/categories/api/category-api.ts`: adds create, update, and delete category mutations.
- `frontend/src/features/categories/index.ts`: exports category feature APIs and UI.
- `frontend/src/features/categories/model/forms.ts`: adds category form validation and defaults.
- `frontend/src/features/categories/ui/category-manager.tsx`: adds reusable category selector, create form, edit form, delete action, and query invalidation.
- `frontend/src/features/categories/ui/category-manager.test.tsx`: covers category create/select/edit behavior from the home-mounted workspace.
- `frontend/src/pages/home/index.tsx`: mounts the category manager on the authenticated home route.
- `frontend/src/shared/api/http-client.ts`: adds shared `PATCH` and `DELETE` helpers.
- `docs/2026-04-25-personal-finance-system-v1/task_9.md`: records this subtask's implementation progress.

## Tests / Verification

- Existing harness checks before adding Task 9 tests:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/app/app.test.tsx`
  - Result: passed, frontend 1 test file and 2 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/modules/auth/auth.test.ts`
  - Result: sandbox run failed with `listen EPERM: operation not permitted 0.0.0.0`; escalated rerun passed, backend 1 test file and 9 tests.
- Focused TDD red-step commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/features/categories/ui/category-manager.test.tsx`
  - Result: failed as expected because the authenticated home UI did not yet render category options.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/modules/categories/categories.test.ts`
  - Result: failed as expected with 404 responses because `/api/categories` was not implemented.
- Focused implementation test commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/features/categories/ui/category-manager.test.tsx`
  - Result: passed, frontend 1 test file and 1 test.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/modules/categories/categories.test.ts`
  - Result: passed, backend 1 test file and 3 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/app/app.test.tsx src/features/categories/ui/category-manager.test.tsx src/shared/api/http-client.test.ts`
  - Result: passed, frontend 3 test files and 5 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/modules/auth/auth.test.ts src/modules/categories/categories.test.ts`
  - Result: passed, backend 2 test files and 12 tests.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: initially reported formatting issues in four changed files; targeted Prettier formatting was applied, then the rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: initially failed on the frontend category manager effect/state pattern; implementation was adjusted, then the rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: initially failed on backend exact-optional typings and route generics; implementation was adjusted, then the rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm test`
  - Result: passed with backend 10 test files and 34 tests, frontend 7 test files and 13 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run test:e2e`
  - Result: passed, 3 Playwright tests.
- Source-driven checks:
  - Used existing Fastify plugin registration, root app decoration, MongoDB transaction, TanStack Query, MSW, and React Testing Library patterns already present in the repository.
- Unavailable/skipped verification:
  - Dependency audit was not run. `task_8.md` records that audit requires external npm registry access and dependency metadata disclosure; no new human approval for that network disclosure was given during this subtask.

## Deviations / Follow-Ups

- No material deviations from Task 9.
- Follow-up: Task 12 should consume the `CategorySelect` inside record value forms when record editor forms are implemented.
- Follow-up: Task 14 should include uncategorized values in report breakdowns using the values unlinked by category deletion.
- Follow-up: dependency audit remains unavailable until the human explicitly approves sending dependency metadata to the npm registry from this environment.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Created after completing Task 9 and recording implementation, verification, unavailable audit check, and follow-ups.

## Next Task

- Recommended next planned task: Task 10, Recurring-Value Tags Backend.
