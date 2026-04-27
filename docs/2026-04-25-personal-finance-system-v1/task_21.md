---
title: Task 21: Privacy And Data Lifecycle
slug: privacy-and-data-lifecycle
type: implementation-task
status: todo
created: 2026-04-26
updated: 2026-04-27
source: plan
plan: plan.md
task: 21
---

Status: TODO

# Task 21: Privacy And Data Lifecycle

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 21 from Implementation Subtasks.
- Planned execution: sequential after Task 20.
- Dependencies: Tasks 1 through 20. `task_1.md` through `task_20.md` exist and
  mark their tasks completed.

Planned task text:

```text
### 21. Privacy And Data Lifecycle

- Add a minimal account settings area if production use with real data is enabled.
- Add authenticated JSON export for the user's finance data, including records, values, categories, recurring tags, and profile metadata.
- Add account deletion that requires password confirmation and hard-deletes the user's records, categories, recurring tags, refresh tokens, and user profile.
- Keep normal record deletion as hard-delete for V1 unless a future recovery feature is explicitly requested.
- Add refresh-token TTL cleanup and document cleanup behavior.
- Document that analytics are out of scope for V1. If analytics are later added, finance amounts, labels, descriptions, category names, and recurring-tag names must not be sent as analytics properties.
- Before production use, add a privacy notice covering data categories, purpose, lawful basis or consent model, retention, deletion/export support, support contact, and third-party processors such as hosting, database, logging, and error reporting providers.
- Add tests for export authorization, account deletion, token invalidation after deletion, and deleted-user data isolation.
```

## Current Decision

- Task 21 is still marked as TODO.
- This task has been skipped for the time being by human direction.
- No implementation work was performed for this task during this pass.
- Refresh-token TTL cleanup is already present in the backend through the
  `refreshTokens.expiresAt` TTL index. The remaining Task 21 scope is export,
  account deletion, privacy notice, processor review, analytics policy, and
  lifecycle/isolation tests.
- The source plan requirements remain valid and should be revisited before any
  production use with real personal finance data.

## Implementation Summary

- Documentation-only task record generated for Task 21.
- No account settings, JSON export, account deletion, privacy notice, analytics
  policy enforcement, processor review, or lifecycle tests were added.
- Refresh-token TTL cleanup was not added in this task because it already exists
  in the current backend index setup.
- The application behavior remains unchanged from the completed Task 20 state.

## Changed Files

- `docs/2026-04-25-personal-finance-system-v1/task_21.md`: records that Task 21
  remains TODO and has been skipped for now.

## Tests / Verification

- Not run. This pass only created the Task 21 status document and intentionally
  did not change application code.

## Deviations / Follow-Ups

- Human-directed deviation: skip Task 21 for now while keeping it marked as
  TODO.
- Follow-up: complete Task 21 before production use with real personal finance
  data, including export, account deletion, deletion-driven token invalidation
  tests, privacy notice, processor review, analytics policy, and lifecycle test
  coverage.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Created as a documentation-only record that keeps Task 21 marked
  TODO and notes that it has been skipped for the time being.
- 2026-04-27: Clarified that refresh-token TTL cleanup is already implemented
  through the backend TTL index and is no longer part of the remaining TODO
  scope.

## Next Task

- Recommended next planned task: Task 22, Documentation And Developer
  Experience.
