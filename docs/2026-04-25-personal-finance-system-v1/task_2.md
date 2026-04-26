---
title: Task 2: Frontend Scaffold
slug: frontend-scaffold
type: implementation-task
status: completed
created: 2026-04-26
updated: 2026-04-26
source: plan
plan: plan.md
task: 2
---

Status: completed

# Task 2: Frontend Scaffold

## Source Plan Task

- Plan path: `docs/2026-04-25-personal-finance-system-v1/plan.md`
- Planned task: Task 2 from Implementation Subtasks.
- Planned execution: sequential after Task 1.
- Dependencies: Task 1. `task_1.md` exists and marks Task 1 completed; the repository already contained the pnpm workspace, root scripts, frontend/backend folders, Node and pnpm setup notes, and local MongoDB compose file needed to implement Task 2 safely.

Planned task text:

```text
### 2. Frontend Scaffold

- Scaffold React + TypeScript with Vite under `frontend/`.
- Install latest stable frontend dependencies, including Tailwind CSS, shadcn/ui, TanStack Query, React Router, React Hook Form, Zod, Recharts, date/money helpers, and test tooling.
- Configure Tailwind and shadcn/ui using current official defaults.
- Add strict TypeScript config, ESLint, Prettier integration, Vitest, React Testing Library, MSW, and Playwright.
- Create the Feature-Sliced Design folder layout and path aliases.
- Add app bootstrap with providers for router, query client, theme, and authenticated user bootstrap.
```

## Implementation Summary

- Implemented sequentially as requested for Task 2.
- Initialized `@finances/frontend` as a Vite, React, TypeScript, and ESM workspace package with scripts for dev, preview, build, lint, typecheck, Vitest, and Playwright.
- Installed current stable frontend runtime dependencies through pnpm: React, React DOM, TanStack Query, React Router, React Hook Form, Zod, Recharts, date-fns, lucide-react, Radix Slot, class-variance-authority, clsx, and tailwind-merge.
- Installed current stable frontend development tooling through pnpm: Vite, React Vite plugin, Tailwind CSS with the Vite plugin, shadcn CLI, tw-animate-css, TypeScript, ESLint, typescript-eslint, Prettier-compatible ESLint config, Vitest, React Testing Library, jest-dom, MSW, jsdom, and Playwright.
- Added strict TypeScript app/node configs with Feature-Sliced Design path aliases for `@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`, and `@`.
- Added Vite configuration with React, Tailwind, Vitest jsdom setup, MSW-backed test setup, and focused unit-test include patterns.
- Added ESLint flat config with type-aware TypeScript linting, React Hooks, React Refresh, browser/node globals, Prettier compatibility, and shadcn UI export handling.
- Added Playwright configuration and a smoke test that builds, previews, and checks the frontend shell.
- Added shadcn-compatible `components.json`, Tailwind/shadcn CSS variable mappings, base light/dark token placeholders, and a shared `Button` primitive.
- Created the Feature-Sliced frontend folder layout under `frontend/src/app`, `pages`, `widgets`, `features`, `entities`, and `shared`.
- Added app bootstrap with `ThemeProvider`, `QueryProvider`, authenticated current-user bootstrap, browser routing, public placeholder pages, and primary navigation.
- Added shared API, date, money, class-name, and testing utilities to support later feature tasks.
- Installed and activated the repository-pinned Node `24.15.0` and Corepack pnpm `10.33.2` locally so the quality gates ran under the declared engine.

## Changed Files

- `frontend/.gitkeep`: removed/moved as the frontend folder gained real source files.
- `frontend/package.json`: added frontend package metadata, scripts, dependencies, and dev dependencies.
- `frontend/index.html`: added Vite HTML entrypoint.
- `frontend/components.json`: added shadcn/ui configuration.
- `frontend/eslint.config.js`: added frontend ESLint flat config.
- `frontend/playwright.config.ts`: added Playwright smoke-test configuration.
- `frontend/tsconfig.json`: added TypeScript project references.
- `frontend/tsconfig.app.json`: added strict browser app TypeScript config and path aliases.
- `frontend/tsconfig.node.json`: added strict Node/config TypeScript config and path aliases.
- `frontend/vite.config.ts`: added Vite, React, Tailwind, alias, and Vitest setup.
- `frontend/src/main.tsx`: added React root bootstrap.
- `frontend/src/app/app.tsx`: composed app providers and router.
- `frontend/src/app/app.test.tsx`: added initial app-shell test coverage.
- `frontend/src/app/providers/auth-context.ts`: added auth context contract and hook.
- `frontend/src/app/providers/auth-provider.tsx`: added current-user bootstrap through TanStack Query.
- `frontend/src/app/providers/index.tsx`: composed theme, query, and auth providers.
- `frontend/src/app/providers/query-provider.tsx`: added shared TanStack Query client provider.
- `frontend/src/app/providers/theme-context.ts`: added initial theme context contract and hook.
- `frontend/src/app/providers/theme-provider.tsx`: added persisted light/dark/system theme class handling.
- `frontend/src/app/router.tsx`: added browser routes, navigation, and placeholder public route shell.
- `frontend/src/app/styles/index.css`: added Tailwind import, shadcn variable mappings, and base styles.
- `frontend/src/entities/user/api/current-user.ts`: added current-user bootstrap API call.
- `frontend/src/entities/user/index.ts`: exported user entity API and types.
- `frontend/src/entities/user/model/types.ts`: defined frontend user DTO types.
- `frontend/src/features/.gitkeep`: preserved the empty Feature-Sliced feature layer for later tasks.
- `frontend/src/widgets/.gitkeep`: preserved the empty Feature-Sliced widget layer for later tasks.
- `frontend/src/pages/home/index.tsx`: added initial home shell.
- `frontend/src/pages/login/index.tsx`: added placeholder login route.
- `frontend/src/pages/not-found/index.tsx`: added fallback route.
- `frontend/src/pages/sign-up/index.tsx`: added placeholder sign-up route.
- `frontend/src/shared/api/http-client.ts`: added basic JSON GET client for `/api`.
- `frontend/src/shared/hooks/.gitkeep`: preserved shared hooks folder for later tasks.
- `frontend/src/shared/lib/date.ts`: added initial date helper.
- `frontend/src/shared/lib/money.ts`: added initial BRL money formatting helper.
- `frontend/src/shared/lib/utils.ts`: added shadcn-compatible `cn` utility.
- `frontend/src/shared/testing/e2e/app.spec.ts`: added Playwright frontend-shell smoke test.
- `frontend/src/shared/testing/setup-tests.ts`: added Vitest jest-dom, MSW, and browser API setup.
- `frontend/src/shared/testing/test-server.ts`: added MSW test server with unauthenticated current-user default.
- `frontend/src/shared/ui/button.tsx`: added shadcn-compatible button primitive.
- `frontend/src/vite-env.d.ts`: added Vite env typing.
- `pnpm-lock.yaml`: recorded resolved frontend dependency versions.
- `docs/2026-04-25-personal-finance-system-v1/task_2.md`: records this subtask's implementation progress.

## Tests / Verification

- TDD note:
  - Strict test-first was not practical because this task created the frontend package and test harness itself.
  - Focused bootstrap tests were added as soon as the harness existed.
- Focused implementation test command:
  - `source ~/.nvm/nvm.sh && nvm use && corepack pnpm --filter @finances/frontend test`
  - Result: initially failed because Vitest was collecting the Playwright spec and jsdom lacked `window.matchMedia`; configuration and test setup were corrected.
  - Rerun result: passed, frontend 1 test file and 1 test.
- Frontend package verification commands:
  - `source ~/.nvm/nvm.sh && nvm use && corepack pnpm --filter @finances/frontend lint`
  - Result: initially surfaced current ESLint/type-aware config issues; configuration was corrected, then the rerun passed.
  - `source ~/.nvm/nvm.sh && nvm use && corepack pnpm --filter @finances/frontend typecheck`
  - Result: initially surfaced TypeScript 6 config compatibility issues; configuration was corrected, then the rerun passed.
  - `source ~/.nvm/nvm.sh && nvm use && corepack pnpm --filter @finances/frontend build`
  - Result: passed after TypeScript/Vite config corrections.
  - `source ~/.nvm/nvm.sh && nvm use && corepack pnpm --filter @finances/frontend test:e2e`
  - Result: initially failed because the Playwright web server command could not find a direct `pnpm` shim; config was changed to use `corepack pnpm`.
  - Result: sandbox run then failed with `listen EPERM: operation not permitted 127.0.0.1:4173`; escalated rerun reached the browser test.
  - Result: browser test initially found duplicate `Login` links; assertions were scoped to primary navigation, then the rerun passed, 1 Playwright test.
- Full quality gate commands:
  - `source ~/.nvm/nvm.sh && nvm use && corepack pnpm format`
  - Result: initially reported formatting issues in four new frontend files; targeted Prettier formatting was applied, then the rerun passed.
  - `source ~/.nvm/nvm.sh && nvm use && pnpm lint`
  - Result: passed after Corepack shims were enabled for nested root scripts.
  - `source ~/.nvm/nvm.sh && nvm use && pnpm typecheck`
  - Result: passed.
  - `source ~/.nvm/nvm.sh && nvm use && pnpm test`
  - Result: passed, frontend 1 test file and 1 test.
  - `source ~/.nvm/nvm.sh && nvm use && pnpm build`
  - Result: passed for frontend production build.
  - `source ~/.nvm/nvm.sh && nvm use && pnpm audit`
  - Result: sandbox run failed with npm registry DNS `ENOTFOUND`; escalated rerun passed with no known vulnerabilities.
  - `source ~/.nvm/nvm.sh && nvm use && pnpm --filter @finances/frontend test:e2e`
  - Result: escalated rerun passed, 1 Playwright test.
- Local dev server:
  - `source ~/.nvm/nvm.sh && nvm use && pnpm --filter @finances/frontend dev -- --port 5173`
  - Result: started successfully at `http://127.0.0.1:5173/` during verification and was later stopped before commit/push cleanup.
- Commit/push record from the implementation session:
  - Branch: `feat/frontend-scaffold`
  - Commit: `7009b4d feat(frontend): scaffold vite react app`
  - Remote: `origin/feat/frontend-scaffold`

## Deviations / Follow-Ups

- No material deviations from Task 2.
- Placeholder login, sign-up, and home pages were intentionally minimal; full auth screens and protected routing are covered by Task 8, and the finance dashboard is covered by later frontend tasks.
- The initial theme provider and CSS variables were scaffolded only far enough to support Tailwind/shadcn and app bootstrap; full semantic theme work is covered by Task 3.
- Follow-up: Task 3 should expand the theme system, add the theme toggle, and document palette/font/radius customization.

## Blocking Questions

None

## Deferred Non-Blocking Questions

None

## Document Changelog

- 2026-04-26: Created after the fact from the Task 2 implementation and commit/push session, matching the existing task progress document format.

## Next Task

- Recommended next planned task: Task 3, Frontend Theme System.
