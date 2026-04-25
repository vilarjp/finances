---
title: Task 5: Database Connection And Indexes
slug: database-connection-and-indexes
type: implementation-task
status: completed
created: 2026-04-25
updated: 2026-04-25
source: plan
plan: plan.md
task: 5
---

Status: completed

# Task 5: Database Connection And Indexes

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 5 from Implementation Subtasks.
- Planned execution: sequential after Task 4.
- Dependencies: Tasks 1, 2, 3, and 4. `task_3.md` and `task_4.md` exist and mark their tasks completed. No `task_1.md` or `task_2.md` progress documents existed, but the repository already contained the workspace and frontend scaffold those tasks established.

Planned task text:

```text
### 5. Database Connection And Indexes

- Implement MongoDB connection lifecycle.
- Add collection definitions and index creation.
- Add test database setup/teardown using `MongoMemoryReplSet` or an equivalent single-node replica-set test harness so transaction behavior is covered in automated tests.
- Add repository test fixtures for users, categories, recurring tags, and records.
- Verify indexes are created in local dev and test contexts.
```

## Implementation Summary

- Added typed MongoDB collection definitions for users, refresh tokens, categories, recurring-value tags, records, and embedded record values.
- Added database connection lifecycle helpers that create a MongoDB client, select the configured database, ensure indexes, expose typed collections, and close the client.
- Wired Fastify app startup to connect to MongoDB by default, create indexes during startup, decorate the app with the database connection, and close the owned client during app shutdown.
- Kept tests able to opt out of database startup with `database: false` for non-database app tests.
- Added planned index creation for all finance collections, including uniqueness, lookup, nested embedded-value, and refresh-token TTL indexes.
- Expanded the `MongoMemoryReplSet` helper into a reusable single-node replica-set test database harness with unique database names, cleanup, shared startup, and global teardown.
- Added repository fixtures for users, categories, recurring-value tags, records, and embedded record values.
- Added focused tests that verify app startup creates indexes and closes its database client, verify all planned index names and TTL options, and verify the new repository fixtures can seed related finance documents.
- Implemented sequentially as requested for Task 5.

## Changed Files

- `README.md`: documented backend index creation and in-memory replica-set integration tests.
- `backend/src/app.ts`: added database startup, app decoration, index creation, and shutdown lifecycle wiring.
- `backend/src/app.test.ts`: opted the pure health-route test out of database startup.
- `backend/src/app.database.test.ts`: added database lifecycle and startup index coverage.
- `backend/src/db/collections.ts`: added typed collection/document definitions.
- `backend/src/db/connection.ts`: added MongoDB connection lifecycle helper.
- `backend/src/db/index.ts`: exported database helpers from one module.
- `backend/src/db/indexes.ts`: added planned collection index creation.
- `backend/src/db/indexes.test.ts`: added index and fixture coverage.
- `backend/src/test/mongodb-memory.ts`: added reusable replica-set database setup/cleanup helpers.
- `backend/src/test/repository-fixtures.ts`: added repository test fixtures for finance documents.
- `backend/src/test/setup.ts`: added global replica-set teardown.
- `backend/vitest.config.ts`: increased backend test timeout for MongoDB integration startup.

## Tests / Verification

- Focused TDD test command before implementation:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run test -- indexes app.database`
  - Result: failed as expected because the database modules and test helpers did not exist yet.
- Focused implementation test command:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run test -- indexes app.database`
  - Result: passed, 4 backend test files and 7 tests.
- Focused backend checks:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run lint`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run typecheck`
  - Result: passed.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm test`
  - Result: passed, backend 4 test files and 7 tests; frontend 3 test files and 4 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
- Sandbox note:
  - MongoDB memory replica-set tests need localhost socket binding. The sandboxed focused test run failed with `listen EPERM: operation not permitted 0.0.0.0`; rerunning with approved escalation passed.

## Deviations / Follow-Ups

- No material deviations from the approved plan.
- The backend Vitest timeout was raised to 30 seconds so MongoDB memory server startup and first-time binary availability do not create false-negative test failures.
- Follow-up: Task 6 should implement shared money, finance timezone, color, and error utilities on top of the database foundation added here.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-25: Created after completing Task 5 and recording verification results.

## Next Task

- Recommended next planned task: Task 6, Shared Domain Utilities.
