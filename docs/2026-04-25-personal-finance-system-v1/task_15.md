---
title: Task 15: Shared Finance Table Frontend
slug: shared-finance-table-frontend
type: implementation-task
status: completed
created: 2026-04-26
updated: 2026-04-26
source: plan
plan: plan.md
task: 15
---

Status: completed

# Task 15: Shared Finance Table Frontend

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 15 from Implementation Subtasks.
- Planned execution: sequential after Task 14.
- Dependencies: Tasks 1 through 14. `task_1.md` through `task_14.md` exist and
  mark their tasks completed.

Planned task text:

```text
### 15. Shared Finance Table Frontend

- Build the shared 5-column finance table component.
- Support compact mobile rendering with expansion or drill-in for nested values.
- Ensure table rendering works for daily, three-day, and monthly datasets.
- Add empty states that preserve the table structure.
- Add tests for column order, record grouping, nested value display, and balance rendering.
```

## Implementation Summary

- Implemented sequentially as requested for Task 15.
- Added a frontend report entity type surface for the Task 14 backend report
  DTOs, including finance rows, report records, denormalized value category/tag
  summaries, home reports, and monthly reports.
- Added a shared `FinanceTable` widget that consumes `FinanceRow[]` and renders
  the planned 5-column structure: Day, Income, Expenses, Daily, and Balance.
- The desktop table keeps nested value details expanded so category and
  recurring-tag display data are visible in grouped record cells.
- The compact layout renders one card-like row per finance day with Income,
  Expenses, and Daily sections. Nested values use accessible expand/collapse
  buttons for drill-in behavior on constrained layouts.
- Empty row datasets still render the table header and a single empty-state row.
  Empty record groups inside populated rows preserve their table cell structure.
- Balance cells use the existing finance balance theme tokens for positive,
  negative, and zero amounts.

## Changed Files

- `frontend/src/entities/report/index.ts`: exports report entity DTO types.
- `frontend/src/entities/report/model/types.ts`: adds frontend types matching
  the backend report row, report record, nested value, category breakdown, home
  report, and monthly report DTOs.
- `frontend/src/widgets/finance-table/index.ts`: exports the finance table
  widget.
- `frontend/src/widgets/finance-table/ui/finance-table.tsx`: implements the
  shared finance table, grouped record cells, nested value display, compact
  drill-in rows, balance styling, and empty states.
- `frontend/src/widgets/finance-table/ui/finance-table.test.tsx`: covers column
  order, record grouping, nested value display, balance rendering, multi-row
  datasets, empty table structure, and compact drill-in controls.
- `docs/2026-04-25-personal-finance-system-v1/task_15.md`: records this
  subtask's implementation progress.

## Tests / Verification

- Existing harness check before adding Task 15 tests:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/features/records/ui/record-workspace.test.tsx`
  - Result: passed, frontend 1 test file and 2 tests.
- Focused TDD red-step command:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/widgets/finance-table/ui/finance-table.test.tsx`
  - Result: failed as expected because `./finance-table` did not exist yet.
- Focused implementation test commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/widgets/finance-table/ui/finance-table.test.tsx`
  - Result: passed, frontend 1 test file and 3 tests.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: initially reported formatting in the two new finance-table files;
    targeted Prettier formatting was applied to those files only, then reruns
    passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm test`
  - Result: sandbox run failed with `listen EPERM` from MongoMemoryServer on
    `0.0.0.0`; escalated rerun passed, backend 13 test files and 44 tests,
    frontend 10 test files and 19 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run test:e2e`
  - Result: sandbox run failed with `listen EPERM` on `127.0.0.1:4173`;
    escalated rerun passed, 3 Playwright tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm audit --audit-level moderate`
  - Result: sandbox run failed with npm registry DNS `ENOTFOUND`. Escalation
    was rejected because `pnpm audit` sends dependency metadata to the external
    npm registry without explicit human approval, so dependency audit remains
    unavailable for this task.
- Source-driven checks:
  - Used the approved plan's Task 15 requirements and the Task 14 backend
    report DTO shape as the implementation source.
  - Reused existing frontend Feature-Sliced layout, record cell renderer,
    finance theme tokens, money formatting, Testing Library style, and Vitest
    conventions.

## Deviations / Follow-Ups

- Non-material implementation detail: Task 15 adds report DTO types and the
  reusable table widget, but does not yet wire the table to live report API
  queries on the home or monthly routes. Task 16 and Task 17 own those page-level
  data integrations.
- Follow-up: Task 16 should render the shared table on the home page for the
  daily and three-day report rows.
- Follow-up: Task 17 should render the shared table on the monthly view for the
  selected month's report rows.
- Follow-up: dependency audit remains unavailable until the human explicitly
  approves sending dependency metadata to the npm registry from this
  environment.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Created after completing Task 15 and recording implementation,
  TDD results, full verification, sandbox escalation notes, unavailable audit
  check, and follow-up scope.

## Next Task

- Recommended next planned task: Task 16, Home Page Frontend.
