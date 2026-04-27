---
title: Frontend Monthly Test Timeout Review
slug: monthly-page-test-timeout
type: code-review
status: approved
created: 2026-04-27
updated: 2026-04-27
approved: 2026-04-27
approval_note: Human approved the code review and confirmed there is nothing to fix or improve.
source: local-diff
---

Status: approved

# Frontend Monthly Test Timeout Review

## Scope

- Review target: local uncommitted changes for the approved monthly-page test timeout diagnosis.
- Review boundary: changed hunks in `frontend/vite.config.ts`, `frontend/src/shared/testing/test-server.ts`, and `frontend/src/shared/api/http-client.test.ts`, plus the relevant untracked diagnosis document at `docs/2026-04-27-monthly-page-test-timeout/diagnosis.md`.
- Context used: `frontend/src/shared/api/http-client.ts`, `frontend/src/shared/testing/setup-tests.ts`, `frontend/src/entities/user/api/current-user.ts`, backend auth refresh cookie handling, `backend/vitest.config.ts`, root and frontend package scripts, `frontend/README.md`, Rubber Duck project-rules, source-driven, and no-workarounds references.
- Verification evidence reviewed: focused client/monthly Vitest run, full frontend Vitest run, `pnpm format`, `pnpm lint`, `pnpm deps:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `git diff --check`.

## Findings

None

## Security / Privacy Notes

None

## Test Coverage Notes

- Focused TDD evidence is present: the added `http-client.test.ts` case failed before the MSW refresh handler because `POST /api/auth/refresh` was unhandled, then passed after the handler was added.
- Existing refresh-success tests still pass with per-test MSW overrides, which exercises that the new default unauthenticated refresh handler does not block authenticated refresh scenarios.
- The monthly edit/copy/paste test passed locally under the explicit frontend timeout and remained around the same runtime range observed in the approved diagnosis.
- Full quality gate status reviewed: `pnpm format`, `pnpm lint`, `pnpm deps:check`, `pnpm typecheck`, `pnpm test`, and `pnpm build` passed. The first sandboxed `pnpm test` run failed because MongoDB memory-server could not bind local ports (`listen EPERM`); rerunning with local port binding allowed passed.
- GitHub Actions was not run from this local review. This is a release-confidence note rather than a blocker for the local diff.
- Residual non-blocking note: the frontend suite still logs pre-existing Recharts zero-size warnings in the home dashboard test. Those warnings are unrelated to the reviewed monthly timeout and auth-refresh harness changes.

## Project Convention Notes

None

## Source-Driven / Workaround Notes

- Vitest `testTimeout` support was verified by the repository's existing backend Vitest configuration and by the frontend suite accepting the new config during focused and full runs.
- The MSW default handler follows the backend refresh contract for a missing refresh cookie: `401` with `REFRESH_TOKEN_MISSING` and `Authentication cookie is missing.`
- No workaround smells were found in the changed code. The timeout is explicit and bounded, and the handler fixes a confirmed test-harness gap instead of suppressing MSW errors or relaxing assertions.

## Plan Alignment

No related plan found. Related approved diagnosis: `docs/2026-04-27-monthly-page-test-timeout/diagnosis.md`.

The reviewed implementation matches the diagnosis' recommended Option 1:

- Adds a modest explicit frontend `testTimeout`.
- Adds a default MSW `POST */api/auth/refresh` handler matching the backend unauthenticated refresh contract.
- Keeps the monthly integration test intact instead of adding sleeps, retries, or skipped assertions.

## Workflow Compliance

- The related diagnosis includes `created`, `updated`, `approved`, `approval_note`, and an approval changelog entry.
- No `task_N.md` progress document was required because the approved diagnosis does not include `Implementation Subtasks`.
- This code review document is approved and includes required metadata.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-27: Created from local diff, approved diagnosis context, and verification results.
- 2026-04-27: Merged code-focused reviewer feedback. Staff-engineering, project-patterns, security, and test reviewers reported no findings; added the non-blocking note that GitHub Actions was not run locally.
- 2026-04-27: Ran document-reviewer final approval-readiness pass; it reported no blocking issues, no missing questions, and an approval recommendation of pass.
- 2026-04-27: Human approved the code review and confirmed there is nothing to fix or improve, so no follow-up implementation phase is needed.

## Approval

Approved on 2026-04-27. Human approved the code review and confirmed there is nothing to fix or improve, so the implementation phase can be skipped.
