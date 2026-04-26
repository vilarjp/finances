---
title: Task 19: End-To-End Workflows
slug: end-to-end-workflows
type: implementation-task
status: completed
created: 2026-04-26
updated: 2026-04-26
source: plan
plan: plan.md
task: 19
---

Status: completed

# Task 19: End-To-End Workflows

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 19 from Implementation Subtasks.
- Planned execution: sequential after Task 18.
- Dependencies: Tasks 1 through 18. `task_1.md` through `task_18.md` exist and
  mark their tasks completed.

Planned task text:

```text
### 19. End-To-End Workflows

- Add Playwright tests for:
  - Sign up, logout, login.
  - Create income record with multiple values.
  - Create fixed expense and daily expense records.
  - Edit category color/name and observe UI update.
  - Copy a record and paste onto another day.
  - Update recurring tag amount and verify future values update while past values do not.
  - Home page desktop layout.
  - Home page mobile carousel layout.
  - Monthly view navigation and editing.
```

## Implementation Summary

- Implemented sequentially as requested for Task 19.
- Added a dedicated Playwright workflow spec with an in-browser API mock that
  follows the existing frontend e2e pattern and keeps the frontend suite
  independent of a live backend server.
- Covered the planned auth flow: sign up, logout, and login.
- Covered record workflows for creating a multi-value income record, fixed
  expense record, and daily expense record.
- Covered category rename/color edit and verified the home chart UI updates
  after invalidation.
- Covered copying a record and pasting its sanitized snapshot onto another day.
- Covered recurring-tag shared amount update and verified the mock propagation
  changes current/future linked values while preserving a past linked value.
- Added explicit home desktop and mobile carousel workflow coverage in the new
  workflow spec, alongside the existing responsive e2e coverage.
- Covered monthly navigation and editing an existing monthly record.

## Changed Files

- `frontend/src/shared/testing/e2e/workflows.spec.ts`: adds stateful Playwright
  workflow coverage and API mock helpers for auth, records, categories,
  recurring tags, home reports, and monthly reports.
- `docs/2026-04-25-personal-finance-system-v1/task_19.md`: records this
  subtask's implementation progress.

## Tests / Verification

- Existing e2e harness baseline:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run test:e2e`
  - Result: default shell Node 18 failed because Vite requires Node 20.19+ or
    22.12+.
  - Rerun with Node 24 in the sandbox failed with `listen EPERM` on
    `127.0.0.1:4173`.
  - Escalated rerun with Node 24 passed, 7 Playwright tests.
- Verification Mode:
  - This subtask is test-only, so a production-code TDD red step would have been
    artificial. The focused check was the new Playwright workflow file itself.
  - Initial focused workflow runs exposed selector/mock-shape issues in the new
    test code, which were corrected before accepting the subtask.
- Focused workflow test:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec playwright test src/shared/testing/e2e/workflows.spec.ts`
  - Result: passed, 7 Playwright tests.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: initially reported formatting in the new workflow spec. Targeted
    Prettier formatting was applied, then rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: initially failed on an unnecessary `async` helper in the new
    workflow spec. The helper was made synchronous, then rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: passed for backend and frontend.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm test`
  - Result: passed, backend 13 test files and 44 tests; frontend 12 test files
    and 25 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run test:e2e`
  - Result: passed, 14 Playwright tests.
- Source-driven checks:
  - Used the approved Task 19 plan text as the implementation contract.
  - Reused the existing Playwright config, preview-server flow, page-route API
    mocking style, responsive overflow assertions, accessible role selectors,
    and React Query invalidation behavior already present in frontend tests.

## Deviations / Follow-Ups

- Non-material implementation detail: the new e2e workflows use stateful
  Playwright route mocks rather than a live backend process. This matches the
  existing frontend e2e harness, keeps the suite fast and deterministic, and
  avoids introducing a second server into `frontend` e2e.
- Follow-up: dependency audit remains the same pre-release follow-up recorded in
  Task 18. It was not part of this Task 19 test-only implementation pass.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Created after completing Task 19 and recording workflow coverage,
  Verification Mode rationale, focused e2e results, full quality gate results,
  and follow-up scope.

## Next Task

- Recommended next planned task: Task 20, Observability, Error Handling, And
  Hardening.
