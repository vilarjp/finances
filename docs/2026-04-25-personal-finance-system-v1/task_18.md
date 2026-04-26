---
title: Task 18: App Shell And Navigation
slug: app-shell-and-navigation
type: implementation-task
status: completed
created: 2026-04-26
updated: 2026-04-26
source: plan
plan: plan.md
task: 18
---

Status: completed

# Task 18: App Shell And Navigation

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 18 from Implementation Subtasks.
- Planned execution: sequential after Task 17.
- Dependencies: Tasks 1 through 17. `task_1.md` through `task_17.md` exist and
  mark their tasks completed.

Planned task text:

```text
### 18. App Shell And Navigation

- Build authenticated layout with collapsible sidebar.
- Show logged-in user's name, page links, create-record action, and logout.
- Add mobile sidebar behavior and floating action button.
- Ensure keyboard navigation, focus management, and aria labels for dialogs, sheets, menus, and carousels.
- Add tests for sidebar expand/collapse, navigation, logout, and mobile create action.
```

## Implementation Summary

- Implemented sequentially as requested for Task 18.
- Replaced the temporary signed-in header with an authenticated app shell that
  wraps the home and monthly routes.
- Added a desktop authenticated sidebar with user identity, Home and Monthly
  page links, active `aria-current` state, sidebar collapse/expand controls,
  theme controls, a new-record action, and logout.
- Kept a separate public navigation header for login, sign-up, and public
  fallback routes.
- Added a mobile header, accessible navigation dialog, Escape-to-close handling,
  focus transfer to the close button, focus restoration on close, and a floating
  mobile new-record action.
- Wired shell new-record actions to navigate to the home route and open the
  existing `RecordEditor` through a one-shot route-state request.
- Added small record editor accessibility improvements: description autofocus
  when the editor opens and Escape-to-close handling for the editor dialog.
- Added app-level tests covering sidebar collapse, authenticated navigation,
  logout, mobile menu focus/close behavior, and the mobile floating create
  action.

## Changed Files

- `frontend/src/app/authenticated-layout.tsx`: adds the authenticated desktop
  sidebar, mobile navigation dialog, mobile floating new-record action, logout,
  active route links, and focus handling.
- `frontend/src/app/router.tsx`: scopes the authenticated shell to protected
  routes and keeps a simpler public header for login/sign-up routes.
- `frontend/src/app/app.test.tsx`: adds focused Task 18 app-shell coverage.
- `frontend/src/features/records/ui/record-workspace.tsx`: consumes shell
  create-record route state and opens the existing create editor once per
  request.
- `frontend/src/features/records/ui/record-editor.tsx`: adds autofocus and
  Escape-key close behavior for the record editor dialog.
- `docs/2026-04-25-personal-finance-system-v1/task_18.md`: records this
  subtask's implementation progress.

## Tests / Verification

- Existing harness check before adding Task 18 tests:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/app/app.test.tsx`
  - Result: passed, frontend 1 test file and 2 tests.
- Focused TDD red-step command:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/app/app.test.tsx`
  - Result: failed as expected because the signed-in app still used the
    temporary header and did not expose the planned authenticated sidebar,
    mobile navigation dialog, or mobile floating new-record action.
- Focused implementation test commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/app/app.test.tsx`
  - Result: passed, frontend 1 test file and 5 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/features/records/ui/record-workspace.test.tsx`
  - Result: passed, frontend 1 test file and 2 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/pages/home/home-page.test.tsx`
  - Result: passed, frontend 1 test file and 1 test.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend exec vitest run src/pages/monthly/monthly-page.test.tsx`
  - Result: passed, frontend 1 test file and 2 tests.
- Full quality gate commands:
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm format`
  - Result: initially reported formatting in the touched frontend files.
    Targeted Prettier formatting was applied to those files, then rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm lint`
  - Result: initially failed on two unused icon imports in the new authenticated
    layout. The imports were removed, then rerun passed.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm typecheck`
  - Result: passed for backend and frontend.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm test`
  - Result: sandbox run failed with MongoMemoryServer `listen EPERM` on
    `0.0.0.0`; escalated rerun passed, backend 13 test files and 44 tests,
    frontend 12 test files and 25 tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm build`
  - Result: passed for backend TypeScript build and frontend production build.
    Vite reported the existing non-failing bundle chunk-size warning.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm --filter @finances/frontend run test:e2e`
  - Result: sandbox run failed with `listen EPERM` on `127.0.0.1:4173`;
    escalated rerun passed, 7 Playwright tests.
  - `PATH=/Users/joao/.nvm/versions/node/v24.15.0/bin:$PATH corepack pnpm audit --audit-level moderate`
  - Result: sandbox run failed with npm registry DNS `ENOTFOUND`. Escalated
    rerun was blocked by the approval reviewer because `pnpm audit` sends the
    workspace dependency graph/package metadata to the npm registry without
    explicit human approval. No workaround was attempted.
- Source-driven checks:
  - Used the approved plan's Task 18 requirements as the implementation source.
  - Reused local React Router route nesting, TanStack Query logout/cache
    patterns, existing auth context, theme toggle, shadcn-style button primitive,
    record editor, record workspace tests, and existing responsive Playwright
    coverage patterns.

## Deviations / Follow-Ups

- Non-material implementation detail: the shell new-record action opens the
  existing home records editor via one-shot React Router location state instead
  of introducing global UI state. This keeps the change scoped and avoids adding
  a new state dependency.
- Follow-up: `pnpm audit --audit-level moderate` needs explicit human approval
  before it can be run with outbound npm registry access in this environment.
- Follow-up: Vite's production build still emits the existing non-failing
  chunk-size warning. This remains suitable for Task 23 final integration and
  polish unless bundle splitting becomes a release requirement earlier.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Created after completing Task 18 and recording implementation,
  TDD results, focused tests, full quality gate results, sandbox escalation
  notes, blocked audit verification, and follow-up scope.

## Next Task

- Recommended next planned task: Task 19, End-To-End Workflows.
