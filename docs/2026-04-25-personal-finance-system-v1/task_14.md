---
title: Task 14: Report And Balance Backend
slug: report-and-balance-backend
type: implementation-task
status: completed
created: 2026-04-26
updated: 2026-04-26
source: plan
plan: plan.md
task: 14
---

Status: completed

# Task 14: Report And Balance Backend

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 14 from Implementation Subtasks.
- Planned execution: sequential after Task 13.
- Dependencies: Tasks 1 through 13. `task_1.md` through `task_13.md` exist and
  mark their tasks completed.

Planned task text:

```text
### 14. Report And Balance Backend

- Implement shared aggregation service for daily rows, three-day rows, monthly rows, category breakdowns, and current-vs-previous-month daily balance series.
- Return income-by-category and expense-by-category totals separately. The home pie/donut chart should show both groups explicitly, preferably as two concentric rings on desktop and a segmented income/expenses toggle on constrained mobile layouts if the dual-ring chart becomes unreadable.
- Use value-level amounts for every total.
- Group records into Income, Expenses, and Daily columns based on `type` and `expenseKind`.
- Treat Balance as daily net amount, not running account balance.
- Include uncategorized values in category breakdowns.
- Add tests with multi-value records spanning multiple categories and recurring tags.
```

## Implementation Summary

- Implemented sequentially as requested for Task 14.
- Added authenticated `GET /api/reports/home?date=YYYY-MM-DD` and
  `GET /api/reports/month?month=YYYY-MM` routes.
- Added report query schemas and response DTOs for finance rows, denormalized
  report records/values, category breakdowns, and daily balance series.
- Added a reports repository for user-scoped record, category, and recurring-tag
  reads.
- Added a shared reports service that builds daily rows, current-day plus
  next-two-day rows, full monthly rows, current-month income and expense
  category breakdowns, and current-vs-previous-month daily balance series.
- Totals are computed from embedded value-level amounts. Records are grouped
  into Income, Expenses, and Daily columns from `type` and `expenseKind`.
  `balanceCents` is daily net income minus fixed and daily expenses, not a
  running balance.
- Category breakdowns keep income and expenses separate, sort named categories
  before uncategorized, and include uncategorized values.
- Report record values include category and recurring-tag display summaries
  when the referenced objects still belong to the authenticated user.

## Changed Files

- `backend/src/app.ts`: registers the reports routes under `/api/reports`.
- `backend/src/modules/reports/reports.controller.ts`: adds authenticated home
  and monthly report controllers.
- `backend/src/modules/reports/reports.repository.ts`: adds user-scoped report
  reads for records, categories, and recurring tags.
- `backend/src/modules/reports/reports.routes.ts`: wires report endpoints and
  auth pre-handlers.
- `backend/src/modules/reports/reports.schemas.ts`: defines query schemas and
  report response DTOs.
- `backend/src/modules/reports/reports.service.ts`: implements shared report
  aggregation, row grouping, category totals, and balance series.
- `backend/src/modules/reports/reports.test.ts`: covers home and monthly report
  behavior with multi-value records, categories, recurring tags, uncategorized
  values, and user scoping.
- `docs/2026-04-25-personal-finance-system-v1/task_14.md`: records this
  subtask's implementation progress.

## Tests / Verification

- Existing harness check before adding Task 14 tests:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/modules/records/records.test.ts`
  - First run without escalation failed with `listen EPERM` from
    MongoMemoryServer. Escalated rerun passed, backend 1 test file and 4 tests.
- Focused TDD red-step command:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/modules/reports/reports.test.ts`
  - Result: failed as expected with `404` for `/api/reports/home` and
    `/api/reports/month` before the reports module was implemented.
- Focused implementation test commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/modules/reports/reports.test.ts`
  - Result: passed, backend 1 test file and 2 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/modules/records/records.test.ts src/modules/reports/reports.test.ts src/modules/categories/categories.test.ts src/modules/recurring-tags/recurring-tags.test.ts`
  - Result: passed, backend 4 test files and 13 tests.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: initially reported formatting in `reports.service.ts`; targeted
    Prettier formatting was applied, then rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: initially failed on unsafe untyped `response.json()` access in the
    new reports tests; fixed by typing parsed report bodies. Rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm test`
  - Result: passed with escalation for local test servers, backend 13 test
    files and 44 tests, frontend 9 test files and 16 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run test:e2e`
  - Result: passed with escalation for the local Vite/Playwright server, 3
    Playwright tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm audit --audit-level moderate`
  - Result: sandbox run failed with npm registry DNS `ENOTFOUND`. Escalation
    was rejected because the audit request would send workspace dependency
    metadata to the public npm registry without explicit human approval, so
    dependency audit remains unavailable for this task.
- Source-driven checks:
  - Used the approved plan's Task 14 requirements and API/UI report DTO notes as
    the implementation source.
  - Reused existing backend controller/service/repository layering, Fastify
    auth pre-handler patterns, Zod query parsing, MongoDB repository access, and
    finance timezone utilities.

## Deviations / Follow-Ups

- Non-material implementation detail: report aggregation is performed in the
  backend service after user-scoped repository reads instead of in a MongoDB
  aggregation pipeline. This keeps the first V1 report implementation aligned
  with the existing service-centric business-rule pattern and test fixtures.
- Follow-up: Task 15 should consume the finance row DTO for the shared frontend
  table.
- Follow-up: Tasks 16 and 17 should consume the new home and monthly report
  endpoints for charts and month navigation.
- Follow-up: dependency audit remains unavailable until the human explicitly
  approves sending dependency metadata to the npm registry from this
  environment.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Created after completing Task 14 and recording implementation,
  TDD results, full verification, sandbox escalation notes, unavailable audit
  check, and follow-up scope.

## Next Task

- Recommended next planned task: Task 15, Shared Finance Table Frontend.
