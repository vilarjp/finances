---
title: Task 10: Recurring-Value Tags Backend
slug: recurring-value-tags-backend
type: implementation-task
status: completed
created: 2026-04-26
updated: 2026-04-26
source: plan
plan: plan.md
task: 10
---

Status: completed

# Task 10: Recurring-Value Tags Backend

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 10 from Implementation Subtasks.
- Planned execution: sequential after Task 9.
- Dependencies: Tasks 1 through 9. `task_3.md`, `task_4.md`, `task_5.md`,
  `task_6.md`, `task_7.md`, `task_8.md`, and `task_9.md` exist and mark their
  tasks completed. `task_1.md` and `task_2.md` also exist and were already part
  of the completed task history in this docs folder.

Planned task text:

```text
### 10. Recurring-Value Tags Backend

- Implement recurring-value tag CRUD API.
- On recurring-value tag delete, unlink the tag from existing values without changing their current saved amounts.
- Implement stored amount update with current/future linked-value propagation based on full `effectiveAt` timestamp in GMT-3 business rules.
- Ensure past linked values are never changed.
- Ensure tag update returns propagation summary, such as number of records and values affected, for UI feedback.
- Implement mandatory MongoDB transaction handling for tag amount updates and linked future-value propagation.
- Add tests for cutoff boundary, same-timestamp update, past records, future records, unlinked values, and cross-user isolation.
```

## Implementation Summary

- Implemented sequentially as requested for Task 10.
- Added authenticated `/api/recurring-tags` backend routes for listing, creating,
  renaming, deleting, and updating a recurring tag amount.
- Added recurring-tag controller, service, repository, and schema modules using
  the existing Fastify, MongoDB, Zod, auth middleware, and HTTP error patterns.
- Enforced user scoping, normalized unique tag names, strict ObjectId parsing,
  tag name limits, and shared integer-cent amount validation.
- Kept regular `PATCH /api/recurring-tags/:tagId` scoped to tag renaming; stored
  amount changes go through `PATCH /api/recurring-tags/:tagId/amount` so they
  cannot bypass propagation.
- Implemented tag delete in a MongoDB transaction and unlinked matching embedded
  record values for the authenticated user only, preserving saved labels and
  amounts.
- Implemented amount updates in one MongoDB transaction: the tag stores the new
  amount and server-captured cutoff instant, future/current linked values with
  `effectiveAt >= cutoff` receive the new amount, and past linked values remain
  unchanged.
- Returned a propagation summary with cutoff instant, affected record count,
  affected value count, and skipped past value count for future UI feedback.

## Changed Files

- `backend/src/app.ts`: mounts recurring-tag routes under
  `/api/recurring-tags`.
- `backend/src/modules/recurring-tags/recurring-tags.controller.ts`: maps
  recurring-tag HTTP requests to service calls and DTO responses.
- `backend/src/modules/recurring-tags/recurring-tags.repository.ts`: implements
  scoped recurring-tag persistence, transactional delete/unlink behavior, and
  transactional amount propagation.
- `backend/src/modules/recurring-tags/recurring-tags.routes.ts`: registers
  authenticated recurring-tag CRUD and amount-update routes.
- `backend/src/modules/recurring-tags/recurring-tags.schemas.ts`: validates
  payloads, ids, normalized names, integer-cent amounts, and response mapping.
- `backend/src/modules/recurring-tags/recurring-tags.service.ts`: owns duplicate
  name handling, not-found handling, delete semantics, and amount propagation
  orchestration.
- `backend/src/modules/recurring-tags/recurring-tags.test.ts`: covers CRUD,
  validation, unlink-on-delete, propagation summary, cutoff boundary,
  same-timestamp inclusion, past/future behavior, unlinked values, and cross-user
  isolation.
- `docs/2026-04-25-personal-finance-system-v1/task_10.md`: records this
  subtask's implementation progress.

## Tests / Verification

- Existing harness check before adding Task 10 tests:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/modules/categories/categories.test.ts`
  - Result: sandbox run failed with `listen EPERM: operation not permitted
0.0.0.0`; escalated rerun passed, backend 1 test file and 3 tests.
- Focused TDD red-step command:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/modules/recurring-tags/recurring-tags.test.ts`
  - Result: failed as expected because `./recurring-tags.service.js` and the
    recurring-tag module did not exist yet.
- Focused implementation test commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/modules/recurring-tags/recurring-tags.test.ts`
  - Result: passed with approved escalation for localhost binding, backend 1
    test file and 4 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend exec vitest run src/modules/auth/auth.test.ts src/modules/categories/categories.test.ts src/modules/recurring-tags/recurring-tags.test.ts`
  - Result: passed with approved escalation for localhost binding, backend 3
    test files and 16 tests.
- Focused backend checks:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run lint`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run typecheck`
  - Result: passed.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: initially reported formatting in
    `backend/src/modules/recurring-tags/recurring-tags.test.ts`; targeted
    Prettier formatting was applied, then the rerun passed. After this task
    document was created, the final format check reported Markdown wrapping in
    `docs/2026-04-25-personal-finance-system-v1/task_10.md`; targeted Prettier
    formatting was applied, then the rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm test`
  - Result: passed with approved escalation for localhost binding, backend 11
    test files and 38 tests, frontend 7 test files and 13 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run test:e2e`
  - Result: sandbox run failed with `listen EPERM: operation not permitted
127.0.0.1:4173`; escalated rerun passed, 3 Playwright tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm audit --audit-level moderate`
  - Result: sandbox run failed with npm registry DNS `ENOTFOUND`; escalated
    rerun passed with no known vulnerabilities.
- Source-driven checks:
  - Used existing category-route patterns for authenticated CRUD, duplicate-key
    handling, transaction-owned unlink behavior, and integration test shape.
  - Used the existing MongoDB single-node replica set test harness so
    transaction paths run against a transaction-capable database.

## Deviations / Follow-Ups

- No material deviations from Task 10.
- Implementation detail: regular tag rename and stored amount updates use
  separate endpoints so amount edits always pass through the propagation path.
- Follow-up: Task 11 should consume the recurring-tag API from the record value
  editor and expose UI that distinguishes applying the stored tag amount from
  updating the shared tag amount.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Created after completing Task 10 and recording implementation,
  verification, sandbox escalation notes, and follow-up scope.

## Next Task

- Recommended next planned task: Task 11, Recurring-Value Tags Frontend.
