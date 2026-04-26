---
title: Task 6: Shared Domain Utilities
slug: shared-domain-utilities
type: implementation-task
status: completed
created: 2026-04-25
updated: 2026-04-25
source: plan
plan: plan.md
task: 6
---

Status: completed

# Task 6: Shared Domain Utilities

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 6 from Implementation Subtasks.
- Planned execution: sequential after Task 5.
- Dependencies: Tasks 1, 2, 3, 4, and 5. `task_3.md`, `task_4.md`, and `task_5.md` exist and mark their tasks completed. No `task_1.md` or `task_2.md` progress documents existed, but the repository already contained the workspace and frontend scaffold those tasks established.

Planned task text:

```text
### 6. Shared Domain Utilities

- Implement shared money utilities for parsing, formatting, and integer-cent arithmetic.
- Implement finance timezone utilities for GMT-3 date derivation, month boundaries, and full timestamp comparisons.
- Implement color validation utilities for `#RRGGBB` hex values and any controlled internal token set.
- Implement shared error types and HTTP error mapping.
- Add unit tests for money, date/time, and color validation edge cases.
```

## Implementation Summary

- Added backend money utilities for BRL-style string parsing, BRL formatting, positive value amount validation, and safe integer-cent addition, subtraction, and summing.
- Added backend finance timezone utilities centered on the `America/Fortaleza` GMT-3 business timezone, including UTC instant creation from finance-local date/time input, finance date/month derivation, finance month boundaries, and full-instant cutoff comparisons.
- Added backend color validation utilities for normalized `#RRGGBB` hex values and a controlled set of semantic color tokens aligned with the current frontend theme tokens.
- Expanded shared HTTP errors with common 4xx factories, Zod/HTTP/generic error mapping, request-id propagation, safe 5xx message redaction, and optional safe error details.
- Moved Fastify error-handler response mapping onto the shared error mapper while preserving the existing request logging behavior.
- Added focused unit tests for money, date/time, color, and error mapping edge cases.
- Implemented sequentially as requested for Task 6.

## Changed Files

- `backend/src/middleware/error-handler.ts`: delegates HTTP response mapping to the shared mapper.
- `backend/src/shared/colors.ts`: added controlled color token and hex validation utilities.
- `backend/src/shared/colors.test.ts`: covered valid hex values, allowed tokens, and invalid CSS/malformed values.
- `backend/src/shared/errors.ts`: added shared error factories and HTTP error mapping.
- `backend/src/shared/errors.test.ts`: covered 4xx mapping, validation mapping, request ids, details, and 5xx redaction.
- `backend/src/shared/finance-time.ts`: added GMT-3 finance date, month boundary, timestamp creation, and cutoff comparison helpers.
- `backend/src/shared/finance-time.test.ts`: covered GMT-3 date derivation, default end-of-day timestamp behavior, strict input validation, month boundaries, and full timestamp comparisons.
- `backend/src/shared/money.ts`: added amount validation, parsing, formatting, and integer-cent arithmetic helpers.
- `backend/src/shared/money.test.ts`: covered BRL parsing/formatting, invalid amount inputs, max amount validation, and integer arithmetic.
- `docs/2026-04-25-personal-finance-system-v1/task_6.md`: recorded this subtask's implementation progress.

## Tests / Verification

- Focused TDD red-step command:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run test -- money finance-time colors errors`
  - Result: failed as expected for missing new utility modules and missing new error helpers. The broad Vitest filter also matched existing database tests, which failed under the sandbox with `listen EPERM` for localhost binding.
- Focused utility test command:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm exec vitest run src/shared/money.test.ts src/shared/finance-time.test.ts src/shared/colors.test.ts src/shared/errors.test.ts`
  - Working directory: `backend/`
  - Result: passed, 4 test files and 15 tests.
- Focused backend checks:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run lint`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/backend run typecheck`
  - Result: passed.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: passed after targeted Prettier formatting of new/edited files.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm test`
  - Result: passed with approved escalation for localhost binding, backend 8 test files and 22 tests; frontend 3 test files and 4 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
- Sandbox note:
  - MongoDB memory replica-set tests still require elevated localhost socket binding, consistent with Task 5.

## Deviations / Follow-Ups

- No material deviations from the approved plan.
- The controlled internal color token set was aligned to semantic frontend theme token names so backend validation can allow stable data-driven token values without accepting arbitrary CSS.
- Follow-up: Task 7 can use the shared error factories, money validation, and finance timezone helpers while implementing authentication and later finance data rules.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-25: Created after completing Task 6 and recording verification results.

## Next Task

- Recommended next planned task: Task 7, Authentication Backend.
