---
title: Task 17: Monthly View Frontend
slug: monthly-view-frontend
type: implementation-task
status: completed
created: 2026-04-26
updated: 2026-04-26
source: plan
plan: plan.md
task: 17
---

Status: completed

# Task 17: Monthly View Frontend

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 17 from Implementation Subtasks.
- Planned execution: sequential after Task 16.
- Dependencies: Tasks 1 through 16. `task_1.md` through `task_16.md` exist and
  mark their tasks completed.

Planned task text:

```text
### 17. Monthly View Frontend

- Build month navigation and selected-month state.
- Render every day from first through last day of selected month.
- Wire inline or modal editing from monthly records.
- Support paste onto a selected day.
- Ensure responsive behavior avoids unusable horizontal scrolling for primary actions.
- Add tests for month boundaries, leap years, navigation, record editing, and paste into target day.
```

## Implementation Summary

- Implemented sequentially as requested for Task 17.
- Added the frontend monthly report query surface for `GET /api/reports/month`
  under the shared report query key so record mutations invalidate monthly data
  alongside home reports.
- Added the authenticated `/monthly` route and a simple header link so the view
  is reachable before the later app-shell/navigation task replaces the current
  temporary header.
- Built the monthly page with URL-backed selected-month state, previous/current/
  next month navigation, month totals, selected-day state, and selected-day paste
  controls.
- Rendered a complete first-through-last-day month by filling any missing report
  days with empty finance rows while still using the backend report rows as the
  source for grouped records and totals.
- Extended the shared `FinanceTable` with optional day and record action slots,
  preserving existing table behavior when no actions are supplied.
- Wired monthly record editing through the existing `RecordEditor` and update
  mutation.
- Wired copy/paste through the existing record clipboard and paste endpoint,
  using the selected day as the paste target.
- Added component tests for leap-year month boundaries, navigation, monthly
  editing, and paste target behavior.
- Added Playwright coverage for monthly desktop and mobile rendering, including
  document-width checks to guard against page-level horizontal overflow.

## Changed Files

- `frontend/src/entities/report/api/report-queries.ts`: adds monthly report
  query key, fetcher, and TanStack Query hook.
- `frontend/src/entities/report/index.ts`: exports the monthly report query
  surface.
- `frontend/src/app/router.tsx`: registers the authenticated `/monthly` route
  and adds a minimal signed-in header link.
- `frontend/src/pages/monthly/index.tsx`: implements the monthly page, month
  navigation, complete month rows, selected day panel, record editing, and paste.
- `frontend/src/pages/monthly/monthly-page.test.tsx`: adds focused Task 17
  component coverage.
- `frontend/src/widgets/finance-table/ui/finance-table.tsx`: adds optional
  day/record action renderers used by the monthly page.
- `frontend/src/shared/testing/test-server.ts`: adds a default monthly report
  MSW handler.
- `frontend/src/shared/testing/e2e/app.spec.ts`: adds monthly desktop/mobile
  Playwright checks.
- `docs/2026-04-25-personal-finance-system-v1/task_17.md`: records this
  subtask's implementation progress.

## Tests / Verification

- Existing harness check before adding Task 17 tests:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/widgets/finance-table/ui/finance-table.test.tsx`
  - Result: passed, frontend 1 test file and 3 tests.
- Focused TDD red-step command:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/pages/monthly/monthly-page.test.tsx`
  - Result: failed as expected because `/monthly` still rendered the existing
    not-found route instead of a monthly view.
- Focused implementation test commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/pages/monthly/monthly-page.test.tsx`
  - Result: passed, frontend 1 test file and 2 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/widgets/finance-table/ui/finance-table.test.tsx`
  - Result: passed, frontend 1 test file and 3 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/app/app.test.tsx`
  - Result: passed, frontend 1 test file and 2 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/pages/home/home-page.test.tsx`
  - Result: passed, frontend 1 test file and 1 test.
- Playwright verification:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run test:e2e`
  - Result: sandbox run failed with `listen EPERM` on `127.0.0.1:4173`.
  - Escalated rerun passed, 7 Playwright tests.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: initially reported formatting in the monthly page, monthly test, and
    finance table files. Targeted Prettier formatting was applied to those
    files, then rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm test`
  - Result: sandbox run failed with MongoMemoryServer `listen EPERM` on
    `0.0.0.0`; escalated rerun passed, backend 13 test files and 44 tests,
    frontend 12 test files and 22 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
    Vite reported the existing non-failing bundle chunk-size warning.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm audit --audit-level moderate`
  - Result: sandbox run failed with npm registry DNS `ENOTFOUND`; escalated
    rerun completed and reported no known vulnerabilities.
- Source-driven checks:
  - Used the approved plan's Task 17 requirements and the Task 14 monthly report
    DTO shape as the implementation source.
  - Reused existing Feature-Sliced routing, TanStack Query report invalidation,
    `FinanceTable`, `RecordEditor`, record clipboard, money/date helpers, MSW
    test patterns, and Playwright responsive checks.

## Deviations / Follow-Ups

- Non-material implementation detail: the page fills missing days client-side
  with empty rows to guarantee first-through-last-day rendering even if a report
  response omits empty days. It does not regroup or recalculate backend records;
  grouped records and totals still come from report rows.
- Non-material implementation detail: a small header link exposes `/monthly`
  before Task 18 implements the final authenticated app shell/sidebar.
- Follow-up: Task 18 should replace the current temporary header navigation with
  the planned authenticated layout, sidebar, create action, logout placement,
  mobile sidebar behavior, and focus management.
- Follow-up: Vite's production build still emits a non-failing chunk-size
  warning. This remains suitable for Task 23 final integration and polish unless
  bundle splitting becomes a release requirement earlier.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Created after completing Task 17 and recording implementation,
  TDD results, responsive Playwright coverage, full verification, sandbox and
  network escalation notes, audit result, and follow-up scope.

## Next Task

- Recommended next planned task: Task 18, App Shell And Navigation.
