---
title: Task 1: Whole Codebase Readiness Review Remediation
slug: whole-codebase-readiness-review-remediation
type: implementation-task
status: completed
created: 2026-04-27
updated: 2026-04-27
source: code-review
code_review: code-review.md
task: 1
---

Status: completed

# Task 1: Whole Codebase Readiness Review Remediation

## Source Plan Task

- Source review path:
  `docs/2026-04-26-whole-codebase-readiness-review/code-review.md`
- Source review status: approved.
- Human request: implement all necessary changes from the approved review, except
  Task 21, which must remain TODO.
- Selected scope: one sequential remediation pass covering the review findings,
  security/privacy hardening that does not implement Task 21, test coverage
  gaps, CI, full-stack smoke coverage, and architecture cleanup.
- Explicitly excluded scope:
  `docs/2026-04-25-personal-finance-system-v1/task_21.md` remains TODO. No
  account export, account deletion, privacy notice, analytics lifecycle work, or
  Task 21 lifecycle tests were implemented.

Review items addressed:

- Preserve nested record value identity and `createdAt` on record updates.
- Clear or scope copied-record clipboard state across users and sessions.
- Use fixed `America/Fortaleza` finance date/month formatting in the frontend.
- Preserve the existing finance-local time when patching only `effectiveDate`.
- Add a CI workflow with install, format, lint, typecheck, tests, build, audit,
  and browser checks.
- Add a real full-stack Playwright smoke test against the backend and disposable
  MongoDB.
- Move recurring-tag value actions into concrete record value rows.
- Clean up small Feature-Sliced Design boundary leaks.
- Harden production environment validation without implementing Task 21.

## Implementation Summary

- Backend record updates now preserve existing nested value `_id` and `createdAt`
  when the submitted payload references an existing value. New values still get
  fresh IDs, and legacy clients without IDs fall back to matching by sort order.
- Backend update validation now rejects nested value IDs that do not belong to
  the record being updated.
- Backend partial `effectiveDate` updates now preserve the previous
  finance-local time unless the client explicitly sends `effectiveTime`.
- Frontend finance date helpers now format days and months with the fixed
  `America/Fortaleza` timezone and expose month range/day-count helpers for the
  home and monthly pages.
- Copied-record session storage now stores a user-scoped envelope with a short
  TTL, clears stale or wrong-user data, reacts to session clear events, and keys
  the provider by authenticated user.
- Recurring-tag amount actions were moved from a standalone sidebar tool into
  the actual record value rows on Home and Monthly, so stored amounts apply to a
  concrete edited value.
- Category and recurring-tag select controls were moved to entity UI modules,
  the theme context was moved to shared config, and report query keys are
  consumed through the entity public barrel.
- Production startup now rejects unsafe production env values: default/missing
  MongoDB URI, placeholder cookie secret, missing frontend origins, and
  non-HTTPS frontend origins.
- Added a GitHub Actions CI workflow and a real full-stack Playwright smoke that
  signs up users, persists a record through the browser/backend/database path,
  and verifies user isolation.
- README files were updated with the new production/env and full-stack e2e
  expectations.

## Changed Files

Root and docs:

- `.github/workflows/ci.yml`
- `README.md`
- `docs/2026-04-26-whole-codebase-readiness-review/task_1.md`

Backend:

- `backend/README.md`
- `backend/package.json`
- `backend/src/config/env.ts`
- `backend/src/config/env.test.ts`
- `backend/src/modules/auth/auth.test.ts`
- `backend/src/modules/records/records.repository.ts`
- `backend/src/modules/records/records.schemas.ts`
- `backend/src/modules/records/records.service.ts`
- `backend/src/modules/records/records.test.ts`
- `backend/src/shared/finance-time.ts`
- `backend/src/shared/finance-time.test.ts`
- `backend/src/test/e2e-server.ts`

Frontend:

- `frontend/README.md`
- `frontend/package.json`
- `frontend/playwright.config.ts`
- `frontend/playwright.full-stack.config.ts`
- `frontend/tsconfig.node.json`
- `frontend/src/app/authenticated-layout.tsx`
- `frontend/src/app/providers/theme-context.ts`
- `frontend/src/app/providers/theme-provider.tsx`
- `frontend/src/entities/category/index.ts`
- `frontend/src/entities/category/ui/category-select.tsx`
- `frontend/src/entities/record/api/record-queries.ts`
- `frontend/src/entities/recurring-tag/index.ts`
- `frontend/src/entities/recurring-tag/ui/recurring-tag-select.tsx`
- `frontend/src/features/categories/index.ts`
- `frontend/src/features/categories/ui/category-manager.tsx`
- `frontend/src/features/records/index.ts`
- `frontend/src/features/records/model/forms.ts`
- `frontend/src/features/records/model/record-clipboard.tsx`
- `frontend/src/features/records/model/record-clipboard.test.tsx`
- `frontend/src/features/records/ui/record-editor.tsx`
- `frontend/src/features/records/ui/record-workspace.tsx`
- `frontend/src/features/records/ui/record-workspace.test.tsx`
- `frontend/src/features/recurring-tags/index.ts`
- `frontend/src/features/recurring-tags/ui/recurring-tag-value-editor.tsx`
- `frontend/src/features/recurring-tags/ui/recurring-tag-value-editor.test.tsx`
- `frontend/src/features/theme-toggle/ui/theme-mode-toggle.tsx`
- `frontend/src/pages/home/index.tsx`
- `frontend/src/pages/monthly/index.tsx`
- `frontend/src/shared/api/http-client.ts`
- `frontend/src/shared/config/theme-context.ts`
- `frontend/src/shared/lib/date.ts`
- `frontend/src/shared/lib/date.test.ts`
- `frontend/src/shared/testing/e2e/full-stack-smoke.spec.ts`
- `frontend/src/shared/testing/e2e/workflows.spec.ts`

## Tests / Verification

Focused verification:

- `pnpm --filter @finances/backend exec vitest run src/config/env.test.ts src/shared/finance-time.test.ts`
  passed: 2 test files, 13 tests.
- `pnpm --filter @finances/backend exec vitest run src/modules/records/records.test.ts`
  passed after sandbox escalation: 1 test file, 5 tests.
- `pnpm --filter @finances/backend exec vitest run src/modules/auth/auth.test.ts`
  passed after sandbox escalation: 1 test file, 11 tests.
- `pnpm --filter @finances/frontend exec vitest run src/shared/lib/date.test.ts src/features/records/model/record-clipboard.test.tsx src/features/records/ui/record-workspace.test.tsx src/features/recurring-tags/ui/recurring-tag-value-editor.test.tsx`
  passed: 4 test files, 7 tests.
- `pnpm --filter @finances/frontend test` passed: 15 test files, 30 tests.

Full quality gate:

- `pnpm format` passed.
- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed after sandbox escalation: backend 14 test files / 57
  tests, frontend 15 test files / 30 tests.
- `pnpm build` passed. Vite emitted the existing non-failing chunk-size warning.
- `pnpm --filter @finances/frontend test:e2e` passed after sandbox escalation:
  14 Chromium tests.
- `pnpm --filter @finances/frontend test:e2e:full-stack` passed after sandbox
  escalation: 1 Chromium test.
- Initial sandbox `pnpm audit --audit-level moderate` failed with DNS
  `ENOTFOUND` because registry access was blocked. Escalated rerun passed with
  no known vulnerabilities.

## TDD / Verification Mode Notes

- Existing nearby frontend tests were run before edits where practical.
- The first broad backend test attempt was blocked by sandbox port binding for
  `mongodb-memory-server`; elevated focused/backend test runs were used after
  implementation to verify behavior.
- Regression tests were added for stable nested value identity, partial
  date-update time preservation, finance timezone formatting, clipboard
  user/expiry/session behavior, inline recurring-tag controls, and production
  env validation.
- Verification Mode was used for non-behavior work where artificial failing
  tests would not add useful confidence: CI workflow wiring, README updates,
  public-barrel/FSD import cleanup, and Playwright config separation.

## Deviations / Follow-Ups

- Task 21 remains TODO exactly as requested. Production use with real personal
  finance data remains blocked until Task 21 is completed.
- The process-local auth rate limiter remains unchanged. The review describes it
  as acceptable for local/private V1 but needing trusted proxy/shared store or
  edge/WAF work before internet exposure; that choice depends on deployment
  architecture and remains outside this Task 21-skipping remediation pass.
- Vite's chunk-size warning remains a non-failing build warning. Splitting the
  bundle can be handled later if it becomes a user-facing concern.

## Blocking Questions

None

## Deferred Non-Blocking Questions

- Choose the production rate-limit and trusted-proxy strategy before exposing
  the application to the internet.
- Decide whether to split the frontend bundle if the current Vite chunk warning
  becomes operationally relevant.

## Document Changelog

- 2026-04-27: Created after completing the approved whole-codebase readiness
  review remediation pass while intentionally leaving Task 21 as TODO.

## Next Task

- Recommended next planned task: complete Task 21 before production use with
  real personal finance data.
- Apart from Task 21 and deployment-specific rate-limit strategy, the approved
  review findings appear remediated and covered by the recorded verification
  commands.
