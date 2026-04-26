---
title: Task 16: Home Page Frontend
slug: home-page-frontend
type: implementation-task
status: completed
created: 2026-04-26
updated: 2026-04-26
source: plan
plan: plan.md
task: 16
---

Status: completed

# Task 16: Home Page Frontend

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 16 from Implementation Subtasks.
- Planned execution: sequential after Task 15.
- Dependencies: Tasks 1 through 15. `task_1.md` through `task_15.md` exist and
  mark their tasks completed.

Planned task text:

```text
### 16. Home Page Frontend

- Build desktop home layout with three PRD sections.
- Build mobile carousel variants for summary cards, charts, and tables.
- Render pie chart by value category and line chart comparing current vs previous month daily balances.
- Use the backend's separate income-by-category and expense-by-category totals for the pie/donut chart instead of mixing income and expense values into one ambiguous net category series.
- Ensure charts and summaries update after relevant mutations.
- Verify responsive behavior at representative mobile, tablet, and desktop widths.
- Add component and Playwright tests for primary home workflows.
```

## Implementation Summary

- Implemented sequentially as requested for Task 16.
- Added the frontend home report query surface for `GET /api/reports/home`,
  rooted under the shared `reports` query key so existing finance mutation
  invalidation refreshes the home dashboard.
- Rebuilt the authenticated home page around the three PRD sections:
  1. Today's income and expense summary cards.
  2. Category flow and daily balance charts.
  3. Today and three-day finance tables using the shared `FinanceTable`.
- Added mobile snap-carousel wrappers for summary cards, charts, and finance
  tables while keeping desktop layouts in two-column and 30% / 70% table grids.
- Rendered the category chart as separate income and expense category series
  using the backend's `currentMonthIncomeByCategory` and
  `currentMonthExpenseByCategory` arrays instead of merging them into one net
  series.
- Rendered the line chart from backend current-month and previous-month daily
  balance series.
- Kept the existing record, category, and recurring-tag tools available below
  the dashboard until the later app-shell and monthly-view tasks replace the
  simple placeholder workflow.
- Updated category and recurring-tag mutation invalidation so report data is
  refreshed after changes that affect chart labels, table denormalization, or
  propagated amounts.
- Hid the desktop table variant below the mobile breakpoint so compact finance
  rows own the mobile layout and offscreen desktop tables do not create page
  overflow.

## Changed Files

- `frontend/src/entities/report/api/report-queries.ts`: adds the home report
  query key, fetcher, and TanStack Query hook.
- `frontend/src/entities/report/index.ts`: exports the report query surface.
- `frontend/src/entities/record/api/record-queries.ts`: uses the report entity's
  shared reports query key for finance invalidation.
- `frontend/src/entities/record/index.ts`: removes the old record-entity export
  of `reportsQueryKey`.
- `frontend/src/pages/home/index.tsx`: implements the report-driven home
  dashboard, responsive carousel sections, summary cards, charts, shared
  tables, loading/error states, and the existing record/category/tag tool area.
- `frontend/src/pages/home/home-page.test.tsx`: adds the focused component test
  for report-driven summaries, charts, carousel regions, and tables.
- `frontend/src/widgets/finance-table/ui/finance-table.tsx`: hides the desktop
  table below the mobile breakpoint so compact rows are the mobile table UI.
- `frontend/src/features/categories/ui/category-manager.tsx`: invalidates
  finance records/reports after category mutations.
- `frontend/src/features/recurring-tags/ui/recurring-tag-value-editor.tsx`:
  invalidates finance records/reports after recurring-tag mutations.
- `frontend/src/shared/testing/test-server.ts`: adds a default home report MSW
  handler for app-level tests.
- `frontend/src/shared/testing/setup-tests.ts`: adds a ResizeObserver test stub
  for chart rendering under jsdom.
- `frontend/src/shared/testing/e2e/app.spec.ts`: adds signed-in home dashboard
  desktop and mobile Playwright coverage.
- `frontend/src/app/styles/index.css`: adds a global horizontal overflow guard
  for the app viewport.
- `docs/2026-04-25-personal-finance-system-v1/task_16.md`: records this
  subtask's implementation progress.

## Tests / Verification

- Existing harness check before adding Task 16 tests:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/widgets/finance-table/ui/finance-table.test.tsx`
  - Result: passed, frontend 1 test file and 3 tests.
- Focused TDD red-step command:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/pages/home/home-page.test.tsx`
  - Result: failed as expected because the current home placeholder did not
    expose the planned `Summary cards` dashboard region.
- Focused implementation test commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/pages/home/home-page.test.tsx`
  - Result: passed, frontend 1 test file and 1 test.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/app/app.test.tsx`
  - Result: passed, frontend 1 test file and 2 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/widgets/finance-table/ui/finance-table.test.tsx`
  - Result: passed, frontend 1 test file and 3 tests.
- Playwright verification:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run test:e2e`
  - Result: sandbox run failed with `listen EPERM` on `127.0.0.1:4173`;
    escalated rerun started the preview server.
  - The first escalated reruns caught mobile page overflow of 391 px on a
    390 px viewport. Investigation traced the overflow to the desktop
    `FinanceTable`'s 980 px table existing inside offscreen mobile carousel
    slides.
  - Final result after hiding the desktop table below `md`: passed, 5
    Playwright tests.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: initially reported formatting in the new home component test and
    e2e file; targeted Prettier formatting was applied to those files, then
    rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: initially failed on one unused type import in the home page; fixed,
    then rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm test`
  - Result: sandbox run failed with `listen EPERM` from MongoMemoryServer on
    `0.0.0.0`; escalated rerun passed, backend 13 test files and 44 tests,
    frontend 11 test files and 20 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
    Vite reported a non-failing bundle chunk-size warning.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm audit --audit-level moderate`
  - Result: sandbox run failed with npm registry DNS `ENOTFOUND`; escalated
    rerun completed and reported no known vulnerabilities.
- Source-driven checks:
  - Used the approved plan's Task 16 requirements and the Task 14 backend report
    DTO shape as the implementation source.
  - Reused existing Feature-Sliced layout, TanStack Query, report DTOs,
    `FinanceTable`, money/date helpers, Testing Library patterns, and
    Playwright configuration.
  - Used the installed Recharts package for chart rendering rather than
    hand-rolled SVG chart logic.

## Deviations / Follow-Ups

- Non-material implementation detail: the mobile carousel uses native
  horizontal scroll snapping rather than a separate carousel dependency. This
  keeps the implementation small while satisfying the mobile carousel behavior
  and responsive Playwright checks.
- Non-material implementation detail: the existing record/category/recurring
  tag work area remains below the dashboard. Later Task 18 owns the final app
  shell/navigation behavior, and Task 17 owns the monthly view.
- Follow-up: Task 17 should replace the "Monthly view" placeholder by wiring
  the selected-month report endpoint and month navigation.
- Follow-up: Vite's production build emits a non-failing chunk-size warning.
  This can be revisited during Task 23 final integration and polish if bundle
  splitting becomes a release requirement.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Created after completing Task 16 and recording implementation,
  TDD results, responsive Playwright correction, full verification, sandbox
  escalation notes, audit result, and follow-up scope.

## Next Task

- Recommended next planned task: Task 17, Monthly View Frontend.
