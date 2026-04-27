---
title: Frontend Monthly Test Timeout In CI
slug: monthly-page-test-timeout
type: diagnosis
status: approved
created: 2026-04-27
updated: 2026-04-27
approved: 2026-04-27
approval_note: Human approved the CI timeout diagnosis.
source: prompt
---

Status: approved

# Frontend Monthly Test Timeout In CI

## Summary

The CI failure is isolated to the frontend Vitest test `src/pages/monthly/monthly-page.test.tsx > edits monthly records and pastes a copied record onto the selected day`, which exceeded Vitest's 5 second default per-test timeout while the workspace test step was running backend and frontend suites concurrently. The most likely root cause is an under-budgeted frontend integration test running under CI resource contention, with a separate MSW `/api/auth/refresh` handler gap adding noisy stderr but not directly matching the failed monthly flow.

## Reproduction

- CI command from the prompt: `pnpm test`, which maps to `pnpm --recursive --if-present test` from the root `package.json`.
- CI environment from `.github/workflows/ci.yml`: `ubuntu-latest`, Node from `.nvmrc` (`24.15.0`), pnpm `10.33.2`.
- Observed CI run: backend and frontend Vitest logs are interleaved, and the backend test suite downloads MongoDB `8.2.1` during the same test step.
- Local reproduction was not confirmed. `pnpm --filter @finances/frontend exec vitest run src/pages/monthly/monthly-page.test.tsx --reporter verbose` passed locally, with the failing CI test taking `1091ms`. A full local frontend verbose run also passed, with that test taking `1292ms`.

## Observed Behavior

- CI reports one failed frontend test:
  - `src/pages/monthly/monthly-page.test.tsx > edits monthly records and pastes a copied record onto the selected day`
  - `Error: Test timed out in 5000ms`
  - Failing declaration line: `frontend/src/pages/monthly/monthly-page.test.tsx:251`
- The backend suite passed, but it downloaded a `122mb` MongoDB binary while the frontend suite was also running.
- Several frontend tests log MSW errors for unhandled `POST /api/auth/refresh` requests. The failing monthly test does not log that request in the provided output.
- The home dashboard test logs Recharts zero-size container warnings, but those warnings are unrelated to the monthly test timeout.

## Expected Behavior

- CI should complete the frontend monthly integration flow within the configured test budget, or the budget should reflect the expected runtime for full-app integration tests on GitHub-hosted runners.
- Frontend tests should not emit unhandled MSW request errors for expected unauthenticated refresh attempts.

## Investigation Notes

- Root `package.json` runs `pnpm --recursive --if-present test`.
- `pnpm recursive --help` reports recursive commands are concurrent by default with `--workspace-concurrency` defaulting to `4`. This matches the interleaved backend and frontend CI logs.
- `frontend/vite.config.ts` configures `environment: "jsdom"`, setup files, and CSS, but does not configure `testTimeout`.
- Local Vitest `4.1.5` source resolves `testTimeout` to `5000ms` when browser mode is not enabled.
- `backend/vitest.config.ts` explicitly sets `testTimeout: 30_000`, so the backend suite already has a CI-aware timeout budget while the frontend suite does not.
- `frontend/src/pages/monthly/monthly-page.test.tsx` renders `<App />`, authenticates through `AuthProvider`, loads monthly report/category/recurring-tag data via MSW, edits a record through `PATCH /api/records/:recordId`, invalidates report queries, copies the updated record, selects `2024-02-29`, and pastes through `POST /api/records/paste`.
- `frontend/src/pages/monthly/index.tsx` awaits `invalidateFinanceData(queryClient)` after update and paste mutations, so the test depends on async React Query invalidation and refetch work before the visible success states settle.
- `frontend/src/shared/testing/setup-tests.ts` uses `server.listen({ onUnhandledRequest: "error" })`.
- `frontend/src/shared/testing/test-server.ts` defines default handlers for `/api/auth/me`, `/api/auth/csrf`, `/api/auth/logout`, categories, recurring tags, records, and reports, but not `/api/auth/refresh`.
- `frontend/src/entities/user/api/current-user.ts` allows `401` and `404` for `/auth/me`, but `frontend/src/shared/api/http-client.ts` attempts a refresh before applying `allowedStatuses` to a `401` response. That explains the repeated public-route `/api/auth/refresh` MSW errors.
- Backend auth tests confirm the refresh contract: missing refresh cookies return `401` with error code `REFRESH_TOKEN_MISSING`, while successful refresh responses return `{ user }`.

## Probable Root Cause

Confidence: medium-high.

The failed test is a broad integration-style UI test with multiple user-event interactions, MSW requests, React Query invalidations, and re-renders, but the frontend Vitest configuration leaves the per-test timeout at the default `5000ms`. In CI, this test runs while pnpm is concurrently executing the backend suite, including MongoDB memory-server startup and binary download. That resource contention is inferred from the interleaved logs and MongoDB download rather than proven by a local timeout reproduction, but it fits the prompt evidence and the local suite passing well under the same timeout.

The missing MSW `/api/auth/refresh` handler is a confirmed frontend test harness defect, but it is probably a secondary issue for this specific failure because the monthly test mocks an authenticated `/api/auth/me` response and the prompt's timeout report does not show an unhandled refresh request for the monthly test.

## Affected Files / Flows

- `frontend/src/pages/monthly/monthly-page.test.tsx`: failing integration test declaration and multi-step monthly edit/copy/paste flow.
- `frontend/src/pages/monthly/index.tsx`: mutation success handlers wait for finance-data invalidation and refetches.
- `frontend/vite.config.ts`: frontend Vitest config lacks a frontend timeout budget.
- `frontend/src/shared/testing/test-server.ts`: missing default `POST /api/auth/refresh` handler.
- `frontend/src/shared/api/http-client.ts`: refresh is attempted on `401` before `allowedStatuses` are applied.
- `.github/workflows/ci.yml`: the quality gate runs root `pnpm test`, which executes workspace tests concurrently by default.

## Solution Options

- Option 1: Give frontend integration tests an explicit timeout budget and clean the MSW auth-refresh default. Add a reasonable `testTimeout` in `frontend/vite.config.ts`, informed by CI timings, and add a default `POST */api/auth/refresh` handler that mirrors the backend contract for unauthenticated refresh (`401` with `REFRESH_TOKEN_MISSING`) while tests that need successful refresh can continue to override it with `{ user }`. This is the smallest likely fix and removes noisy harness errors.
- Option 2: Reduce CI contention by splitting backend and frontend tests into separate CI steps, or by running `pnpm --recursive --workspace-concurrency=1 --if-present test`. This directly addresses the concurrent backend MongoDB startup competing with frontend jsdom tests, but it may increase total CI wall time.
- Option 3: Narrow the monthly test's scope so it no longer renders the full app/auth/router shell for edit and paste behavior. This can make the test faster and less sensitive to global app bootstrap, but it requires more refactoring and risks losing route/auth coverage unless another test keeps that coverage.

## Recommended Next Step

Start with Option 1, then rerun the full CI-equivalent quality step. The timeout should be explicit and modest, not a blanket mask for slow tests; pair it with the `/api/auth/refresh` MSW handler cleanup so the frontend suite has clean failure signals. If CI still shows the monthly test near or above the new budget, follow with Option 2 or split the monthly flow into smaller tests.

## Verification Plan

- Run `pnpm --filter @finances/frontend exec vitest run src/pages/monthly/monthly-page.test.tsx --reporter verbose`.
- Run `pnpm --filter @finances/frontend exec vitest run --reporter verbose` and confirm no unhandled MSW `/api/auth/refresh` errors remain.
- Run the root `pnpm test` locally when feasible.
- Verify the GitHub Actions `Unit and integration tests` step passes on `ubuntu-latest`.
- Check that the monthly test remains meaningfully bounded; if it trends above the chosen timeout, investigate test structure rather than raising the timeout again.

## Workaround / Root-Cause Check

The recommendation is not to add sleeps, retries, or skipped assertions. An explicit frontend test timeout addresses the identified mismatch between a full-app integration test and Vitest's default `5000ms` budget under CI resource contention. The MSW handler cleanup addresses a confirmed test harness defect that currently creates expected unauthenticated traffic without a matching handler.

## Blocking Questions

None.

## Deferred Non-Blocking Questions

- Whether the backend MongoDB binary is already cached in CI. This is non-blocking because the provided failing log shows an actual download during the failed run, which is enough to establish CI contention for this diagnosis.

## Document Changelog

- 2026-04-27: Created from prompt-provided CI failure log and local repository investigation.
- 2026-04-27: Applied document-reviewer feedback by marking CI contention as inferred evidence and clarifying the backend `/api/auth/refresh` contract for the MSW handler recommendation.
- 2026-04-27: Human approved the diagnosis.

## Approval

Approved on 2026-04-27. Human approved the CI timeout diagnosis.
