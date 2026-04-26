---
title: Task 11: Recurring-Value Tags Frontend
slug: recurring-value-tags-frontend
type: implementation-task
status: completed
created: 2026-04-26
updated: 2026-04-26
source: plan
plan: plan.md
task: 11
---

Status: completed

# Task 11: Recurring-Value Tags Frontend

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 11 from Implementation Subtasks.
- Planned execution: sequential after Task 10.
- Dependencies: Tasks 1 through 10. `task_1.md` through `task_10.md` exist and
  mark their tasks completed.

Planned task text:

```text
### 11. Recurring-Value Tags Frontend

- Build recurring-tag selector and create-from-value flow in the record value editor.
- Build UI that clearly distinguishes applying a tag's stored amount to one value from updating the shared tag amount.
- Add unlink action for a value.
- Add propagation confirmation or post-save summary if the implementation chooses that UX; this is allowed by the PRD's deferred question but should not block core behavior.
- Add tests around selecting, creating, applying, editing, and unlinking tags.
```

## Implementation Summary

- Implemented sequentially as requested for Task 11.
- Added a frontend recurring-tag entity slice with typed API query hooks for
  `GET /api/recurring-tags`.
- Added recurring-tag feature API calls and validation for create, rename, and
  shared amount update mutations.
- Added a reusable `RecurringTagSelect` and `RecurringTagValueEditor` component
  that can be embedded in the future record value editor.
- The value editor supports selecting a tag, creating a tag from the current
  value amount, applying a tag's stored amount to the one edited value, updating
  the selected shared tag amount through the propagation endpoint, renaming the
  selected tag, and unlinking the value from the tag.
- Added a post-save propagation summary for shared amount updates.
- Mounted the recurring-tag value editor on the authenticated home workspace as
  the first consuming surface until the full record editor arrives in Task 13.
- Added default MSW handlers for empty category and recurring-tag lists so
  authenticated-home tests have stable defaults and targeted tests can override
  them.

## Changed Files

- `frontend/src/entities/recurring-tag/api/recurring-tag-queries.ts`: adds
  recurring-tag fetcher, query key, and query hook.
- `frontend/src/entities/recurring-tag/index.ts`: exports recurring-tag entity
  APIs and types.
- `frontend/src/entities/recurring-tag/model/types.ts`: defines recurring-tag
  and propagation DTO types.
- `frontend/src/features/recurring-tags/api/recurring-tag-api.ts`: adds create,
  rename, and shared-amount update API calls.
- `frontend/src/features/recurring-tags/index.ts`: exports recurring-tag feature
  APIs, validation, and UI.
- `frontend/src/features/recurring-tags/model/forms.ts`: adds recurring-tag name
  and amount validation schemas.
- `frontend/src/features/recurring-tags/ui/recurring-tag-value-editor.tsx`: adds
  reusable recurring-tag selector and value-editor UI.
- `frontend/src/features/recurring-tags/ui/recurring-tag-value-editor.test.tsx`:
  covers selecting, creating, applying, editing, and unlinking recurring tags.
- `frontend/src/pages/home/index.tsx`: mounts the recurring-tag value editor and
  updates the next-slice placeholder to Records.
- `frontend/src/shared/testing/test-server.ts`: adds default empty handlers for
  category and recurring-tag list requests.
- `docs/2026-04-25-personal-finance-system-v1/task_11.md`: records this
  subtask's implementation progress.

## Tests / Verification

- Existing harness check before adding Task 11 tests:
  - `corepack pnpm --filter @finances/frontend exec vitest run src/features/categories/ui/category-manager.test.tsx`
  - Result: failed because the default shell was Node 18.20.3 while the
    workspace requires Node 24.15.x.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/features/categories/ui/category-manager.test.tsx`
  - Result: passed, frontend 1 test file and 1 test.
- Focused TDD red-step command:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/features/recurring-tags/ui/recurring-tag-value-editor.test.tsx`
  - Result: failed as expected because the authenticated home route did not yet
    render a `Recurring Tags` workspace.
- Focused implementation test commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/features/recurring-tags/ui/recurring-tag-value-editor.test.tsx`
  - Result: passed, frontend 1 test file and 1 test.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/app/app.test.tsx src/features/categories/ui/category-manager.test.tsx src/features/recurring-tags/ui/recurring-tag-value-editor.test.tsx src/shared/api/http-client.test.ts`
  - Result: passed, frontend 4 test files and 6 tests.
- Focused frontend checks:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run lint`
  - Result: initially failed on a React hooks rule for setting form draft state
    from an effect; the component was adjusted to use derived draft state, then
    the rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run typecheck`
  - Result: passed.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: initially reported formatting in three changed frontend files;
    targeted Prettier formatting was applied, then the rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm test`
  - Result: sandbox run failed with a localhost bind error (`listen EPERM` on
    `0.0.0.0`); escalated rerun passed, backend 11 test files and 38 tests,
    frontend 8 test files and 14 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run test:e2e`
  - Result: sandbox run failed with a localhost bind error (`listen EPERM` on
    `127.0.0.1:4173`); escalated rerun passed, 3 Playwright tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm audit --audit-level moderate`
  - Result: sandbox run failed with npm registry DNS `ENOTFOUND`. Escalation was
    rejected because audit would send dependency metadata to the npm registry
    without explicit human approval, so dependency audit remains unavailable for
    this task.
- Source-driven checks:
  - Used the Task 10 backend recurring-tag schemas and controller response
    shapes for frontend DTOs.
  - Followed existing category feature patterns for TanStack Query keys,
    mutation invalidation, MSW test handlers, form validation, and home-route
    staging.

## Deviations / Follow-Ups

- Non-material implementation detail: the full record editor does not exist yet
  because record backend and frontend work are planned for Tasks 12 and 13. This
  task therefore introduced a reusable recurring-tag value editor and mounted it
  on the home workspace as the current consuming surface.
- Follow-up: Task 13 should embed `RecurringTagValueEditor` or
  `RecurringTagSelect` in the actual record value form and wire it to persisted
  record value state.
- Follow-up: dependency audit remains unavailable until the human explicitly
  approves sending dependency metadata to the npm registry from this environment.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Created after completing Task 11 and recording implementation,
  verification, sandbox escalation notes, unavailable audit check, and follow-up
  scope.

## Next Task

- Recommended next planned task: Task 12, Records Backend.
