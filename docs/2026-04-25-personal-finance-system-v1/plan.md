---
title: Personal Finance System V1 Implementation Plan
slug: personal-finance-system-v1
type: plan
status: approved
created: 2026-04-25
source: prd
approved: 2026-04-25
approval_note: Human approved the implementation plan.
---

Status: approved

# Personal Finance System V1 Implementation Plan

## Summary

Build the approved Personal Finance System V1 as a greenfield full-stack web app with source code split into `frontend/` and `backend/`. The frontend will be a React, TypeScript, Tailwind CSS, shadcn/ui, and TanStack Query SPA organized with Feature-Sliced Design. The backend will be a Node.js, TypeScript, and MongoDB API organized around controller/service/repository modules. Implementation will be split into incremental, testable subtasks covering project setup, authentication, finance data modeling, records/values, categories, recurring-value propagation, reports, responsive home/monthly UI, copy/paste, theming, and release-quality gates.

## Source Context

- Source PRD: `docs/2026-04-25-personal-finance-system-v1/prd.md`.
- PRD status: approved on 2026-04-25.
- Additional planning constraints from the human:
  - Source code should be organized into two top-level application folders: `frontend/` and `backend/`.
  - Frontend must use React, Tailwind CSS, shadcn/ui, TanStack Query, and Feature-Sliced Design.
  - Frontend theme must support easy light/dark customization of color palette, font family, and border radius.
  - Backend must use Node.js with MongoDB and follow controller/service/repository architecture.
  - Both apps must use current best practices, latest stable package versions at implementation time, TypeScript, ESLint, Prettier, tests, and essential development tooling.
  - The implementation plan should be split into many incremental subtasks.

## Current System Notes

- At planning time on 2026-04-25, the repository is greenfield. The only current project file is the approved PRD under `docs/2026-04-25-personal-finance-system-v1/prd.md`.
- At planning time, the current `main` branch has no commits yet.
- At planning time, there is no existing package manager config, application source, test setup, database schema, CI, or deployment config to preserve.
- The `docs/` folder already exists and should remain separate from application source.
- Because implementation has not started, the plan can establish conventions without migration or compatibility concerns for existing app data.

## Key Decisions

- Use a pnpm workspace at the repository root to coordinate `frontend/` and `backend/` scripts while keeping application source in the requested two folders.
- Resolve all runtime and dev dependencies from latest stable releases during implementation with package-manager `latest` dist-tags and current official scaffolding commands. Avoid hard-coding package versions in this plan so the implementer can install the true latest stable versions when each subtask starts; record resolved versions in committed lockfiles and setup docs.
- Use React with Vite for the frontend SPA. Avoid Next.js because V1 requirements do not need SSR, server actions, or file-based full-stack routing.
- Use TanStack Query as the source of truth for server state. Keep client state small and local. Do not install Zustand initially; use component state, layout context, or session storage for UI-only state unless a later implementation note documents a concrete cross-route state problem.
- Use React Router for frontend routing, React Hook Form plus Zod for forms, Recharts for charts, and shadcn/ui primitives for dialogs, sheets, forms, carousels, menus, buttons, tables, and theme-friendly components.
- Use a modular backend structure where each domain module contains its controller, service, repository, validation schema, and tests. This satisfies controller/service/repository while keeping domain code close together.
- Use Fastify for the backend HTTP layer because it has strong TypeScript ergonomics, route encapsulation, validation integration, plugin support, and fast in-process HTTP testing. Keep controller/service/repository boundaries explicit instead of putting business rules in route handlers.
- Use the official MongoDB Node.js driver behind repositories. Default to Zod for request validation and domain input parsing unless the implementer records a specific reason to replace it.
- Use MongoDB with embedded record values inside a `records` collection for V1. This keeps record/value edits atomic, makes copy/paste straightforward, and still supports category and recurring-tag aggregation via `$unwind`.
- Store money as integer cents, not floating-point numbers. V1 assumes BRL display semantics and does not implement multi-currency conversion.
- Store timestamps as UTC instants and derive finance business fields in the fixed GMT-3 business timezone. Use an IANA timezone constant such as `America/Fortaleza` to avoid scattered offset math while satisfying the PRD's GMT-3 requirement.
- Use httpOnly secure cookie authentication with refresh-token rotation. Access to finance data must always be scoped by authenticated `userId`.
- Use backend report endpoints for home and monthly aggregates so charts, tables, and balances share one authoritative calculation path.
- Treat any production deployment as potentially containing real personal finance data. Include privacy, export, deletion, retention, and provider-review gates before production use rather than assuming the app is demo-only.

## Proposed Architecture

### Repository Layout

```text
.
├── docs/
│   └── 2026-04-25-personal-finance-system-v1/
│       ├── prd.md
│       └── plan.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── pages/
│   │   ├── widgets/
│   │   ├── features/
│   │   ├── entities/
│   │   └── shared/
│   └── ...
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── modules/
│   │   ├── shared/
│   │   ├── app.ts
│   │   └── server.ts
│   └── ...
├── package.json
├── pnpm-workspace.yaml
├── .editorconfig
├── .gitignore
└── compose.yaml
```

Root files should contain workspace orchestration, shared formatting/linting config, local MongoDB compose support, and documentation only. Application source belongs in `frontend/` and `backend/`.

### Frontend Structure

Use Feature-Sliced Design layers:

- `frontend/src/app`: app bootstrap, providers, router, global styles, theme provider, query client setup.
- `frontend/src/pages`: route-level pages such as sign up, login, home, monthly view, and fallback routes.
- `frontend/src/widgets`: composed page regions such as app sidebar, authenticated layout, finance tables, home summary section, chart section, and record editor shell.
- `frontend/src/features`: user actions such as sign up, login, logout, create record, edit record, delete record, copy record, paste record, edit category, create recurring tag, update recurring tag amount, unlink recurring tag, and theme toggle.
- `frontend/src/entities`: domain models and UI fragments for user, record, record value, category, recurring-value tag, daily finance row, and report summary.
- `frontend/src/shared`: reusable API client, UI primitives, shadcn components, lib utilities, date/money formatting, config, constants, test utilities, and base styles.

Theme setup:

- Keep app design tokens in one small surface, for example `frontend/src/app/styles/theme.css` plus optional `frontend/src/shared/config/theme.ts`.
- Use CSS variables for semantic colors, font families, border radius, chart colors, table colors, record colors, and state colors.
- Configure Tailwind and shadcn/ui to consume the same variables for light and dark modes.
- Store selected theme in local storage and apply it by class on the document root.
- Keep record/category custom colors as data-driven values with validation rather than hard-coded Tailwind classes.

### Backend Structure

Use domain modules with controller/service/repository boundaries:

```text
backend/src/modules/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.routes.ts
│   ├── auth.service.ts
│   ├── auth.repository.ts
│   ├── auth.schemas.ts
│   └── auth.test.ts
├── users/
├── records/
├── categories/
├── recurring-tags/
└── reports/
```

Layer responsibilities:

- Controllers parse route input, call services, and map service results/errors to HTTP responses.
- Services own business rules, authorization checks, recurring-tag propagation, date boundaries, copy/paste semantics, and aggregate calculations.
- Repositories own MongoDB collection access, indexes, query filters, transactions, and persistence mapping.
- Validation schemas define request/response contracts and should be reused for runtime validation and TypeScript inference where practical.
- Shared backend utilities should cover errors, auth context, money conversion, timezone conversion, pagination, object id parsing, and test fixtures.

## Data Model / Migrations

V1 is greenfield, so there are no migrations from existing application data. Implement MongoDB collection creation and indexes during backend startup or through a repeatable setup script.

### Collections

`users`

- `_id`
- `name`
- `email`
- `normalizedEmail`
- `passwordHash`
- `createdAt`
- `updatedAt`
- Indexes:
  - Unique `normalizedEmail`.

`refreshTokens`

- `_id`
- `userId`
- `familyId`
- `tokenHash`
- `expiresAt`
- `revokedAt`
- `replacedByTokenId`
- `reuseDetectedAt`
- `lastUsedAt`
- `createdAt`
- Optional `userAgentHash` and `ipHash` if easy to capture without retaining raw sensitive request metadata.
- Indexes:
  - `userId`
  - `familyId`
  - Unique `tokenHash`
  - TTL or cleanup index on `expiresAt`.

`categories`

- `_id`
- `userId`
- `name`
- `normalizedName`
- `fontColor`
- `backgroundColor`
- `createdAt`
- `updatedAt`
- Indexes:
  - Unique compound `userId + normalizedName`.
  - `userId`.

`recurringValueTags`

- `_id`
- `userId`
- `name`
- `normalizedName`
- `amountCents`
- `lastAmountUpdatedAt`
- `createdAt`
- `updatedAt`
- Indexes:
  - Unique compound `userId + normalizedName`.
  - `userId`.

`records`

- `_id`
- `userId`
- `effectiveAt` as UTC instant.
- `financeDate` as `YYYY-MM-DD` derived in GMT-3.
- `financeMonth` as `YYYY-MM` derived in GMT-3.
- `type`: `income` or `expense`.
- `expenseKind`: `fixed`, `daily`, or `null` for income.
- `description`
- `fontColor`
- `backgroundColor`
- `values`: embedded array of value subdocuments:
  - `_id`
  - `label`
  - `amountCents`
  - `categoryId`
  - `recurringValueTagId`
  - `sortOrder`
  - `createdAt`
  - `updatedAt`
- `createdAt`
- `updatedAt`
- Indexes:
  - Compound `userId + financeDate`.
  - Compound `userId + financeMonth`.
  - Compound `userId + effectiveAt`.
  - Compound `userId + values.categoryId`.
  - Compound `userId + values.recurringValueTagId`.

### Persistence Rules

- Every finance collection query must include `userId`.
- Records must have at least one value before save.
- Expense records must have `expenseKind`; income records must not.
- A value may have zero or one category.
- A value may have zero or one recurring-value tag.
- Record totals are always computed from embedded values, never stored as a mutable source of truth.
- Date-only record creation from a day cell uses a default effective time of `23:59:59.999` in the GMT-3 business timezone, so same-day planned records remain current/future for recurring-tag propagation throughout that finance day. If the user explicitly sets a time, that exact time participates in cutoff rules.
- Recurring-value tag amount updates must capture one server-side cutoff instant, store it as `lastAmountUpdatedAt`, and use that same instant for the linked-value update query. The boundary is inclusive: records with `effectiveAt >= lastAmountUpdatedAt` update; records before it do not.
- Recurring-value tag updates, category delete/unlink operations, recurring-tag delete/unlink operations, and any future bulk finance mutation must run in MongoDB transactions. Local development MongoDB must run as a single-node replica set so transaction behavior is exercised outside production.
- Record and category/tag delete behavior is hard-delete for the deleted object. Linked embedded values remain, with deleted category/tag references unset so finance amounts and historical labels remain intact.

### Validation Limits

- Request body size limit: 256 KB unless a narrower route-specific limit is practical.
- User name: 1-80 characters.
- Email: valid email format, max 254 characters, normalized before uniqueness checks.
- Password: 12-128 characters.
- Category and recurring tag names: 1-80 plain-text characters.
- Record descriptions: max 500 plain-text characters.
- Value labels: 1-120 plain-text characters.
- Values per record: max 50.
- Amounts: integer cents, greater than 0 and less than or equal to 999,999,999 cents.
- Colors: only `#RRGGBB` hex strings or a controlled internal token set; no arbitrary CSS values.
- Date inputs: strict ISO `YYYY-MM-DD`; month inputs: strict `YYYY-MM`.
- Record range queries: maximum 370 days per request.
- Report endpoints: home accepts one date; month accepts one selected month.

## API / UI Behavior

### API Contract

Initial API namespace: `/api`.

Auth:

- `POST /api/auth/signup`: create user, set auth cookies, return safe user profile.
- `POST /api/auth/login`: verify credentials, rotate refresh token, set auth cookies, return safe user profile.
- `POST /api/auth/logout`: revoke current refresh token and clear cookies.
- `POST /api/auth/refresh`: rotate refresh token and issue a new access cookie.
- `GET /api/auth/csrf`: return a signed CSRF token bound to the current authenticated session for browser mutating requests.
- `GET /api/auth/me`: return current authenticated user profile.

Auth/session contract:

- Access cookie: `__Host-finance_access`, httpOnly, Secure in production, SameSite=Lax, path `/api`, 15-minute lifetime.
- Refresh cookie: `__Host-finance_refresh`, httpOnly, Secure in production, SameSite=Lax, path `/api/auth`, 30-day lifetime.
- CSRF flow: after authentication, the SPA calls `GET /api/auth/csrf`, stores the returned token in memory, and sends it as `X-CSRF-Token` on every authenticated mutating request. The backend rejects missing, expired, or invalid CSRF tokens with 403.
- Refresh rotation: every successful refresh replaces the refresh token and stores token-family lineage. Reuse detection revokes the token family. The frontend should use a single-flight refresh helper and BroadcastChannel/session coordination to reduce multi-tab refresh races.
- Logout revokes the current refresh token family for the browser session and clears auth cookies. A later "logout all sessions" action can be added separately if needed.
- Cookie signing/encryption secrets must come from environment variables, never source code, and must be validated at startup.

Categories:

- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/:categoryId`
- `DELETE /api/categories/:categoryId`

Recurring-value tags:

- `GET /api/recurring-tags`
- `POST /api/recurring-tags`
- `PATCH /api/recurring-tags/:tagId`
- `PATCH /api/recurring-tags/:tagId/amount`: update stored amount and propagate to current/future linked values.
- `DELETE /api/recurring-tags/:tagId`

Records:

- `GET /api/records?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/records`
- `GET /api/records/:recordId`
- `PATCH /api/records/:recordId`
- `DELETE /api/records/:recordId`
- `POST /api/records/paste`: create a new record from a copied record snapshot onto a target finance date while preserving all copied record and nested value data except target date and optional target time.

Reports:

- `GET /api/reports/home?date=YYYY-MM-DD`: current-day totals, current-month category breakdown, current-vs-previous-month daily balance series, current-day table rows, and current-day-plus-next-2-days table rows.
- `GET /api/reports/month?month=YYYY-MM`: rows for every day in the selected month with records grouped into Income, Expenses, Daily, and Balance.

### Core API Payload Notes

Record create/update payload:

- `effectiveDate`: `YYYY-MM-DD`.
- `effectiveTime`: optional `HH:mm`; omitted date-only creates use `23:59:59.999` GMT-3.
- `type`: `income` or `expense`.
- `expenseKind`: `fixed`, `daily`, or omitted for income.
- `description`, `fontColor`, `backgroundColor`.
- `values`: 1-50 items with `label`, `amountCents`, optional `categoryId`, optional `recurringValueTagId`, and `sortOrder`.

Record response:

- `id`, `effectiveAt`, `financeDate`, `financeMonth`, `type`, `expenseKind`, `description`, `fontColor`, `backgroundColor`, `values`, `totalAmountCents`, `createdAt`, `updatedAt`.
- Values include stable `id`, saved fields, and optional denormalized `category` and `recurringValueTag` display summaries when returned from report endpoints.

Paste payload:

- Copy stores a sanitized immutable record snapshot in frontend layout context plus session storage, not only a source id. Pasting uses that snapshot so copy/paste behaves like spreadsheet copy/paste even if the original record changes later.
- `POST /api/records/paste` accepts `sourceRecordId` for audit/debug context, `sourceSnapshot`, `targetDate`, and optional `targetTime`.
- Paste may override only date and, when supplied, time. It must not override description, colors, type, expense kind, labels, values, category ids, or recurring-tag ids.
- Backend validates all snapshot fields and verifies referenced category/tag ids still belong to the authenticated user. If a referenced category or tag no longer exists, the backend returns a validation error instead of silently changing the pasted data.

Recurring amount update response:

- Returns the updated tag, the server-captured inclusive cutoff instant, affected record count, affected value count, and skipped past value count when practical.

Finance row/report DTO:

- Use one authoritative backend DTO for daily, three-day, and monthly tables: `date`, `incomeRecords`, `fixedExpenseRecords`, `dailyExpenseRecords`, `incomeTotalCents`, `fixedExpenseTotalCents`, `dailyExpenseTotalCents`, `balanceCents`.
- Report record/value DTOs include denormalized category and recurring-tag display data needed by table cells and chart tooltips, while canonical writes still use ids.
- The frontend shared finance table consumes this DTO everywhere and must not reimplement grouping logic.

### UI Behavior

- Public routes: login and sign-up.
- Authenticated routes: home and monthly view.
- Authenticated layout includes collapsible sidebar with user name, navigation, create-record action, and logout.
- Mobile layout keeps sidebar accessible while preserving primary actions; mobile home also shows a floating create-record button.
- Home desktop layout:
  - Section 1: two big-number cards for today's income and expenses.
  - Section 2: pie chart and line chart side by side.
  - Section 3: daily table and three-day table in a 30% / 70% layout.
- Home mobile layout:
  - Section 1 carousel for summary cards.
  - Section 2 carousel for charts.
  - Section 3 carousel for daily and three-day tables.
- Monthly view:
  - Month switcher for previous/current/next navigation.
  - One table with every day from selected month start through selected month end.
  - Shared 5-column structure: Day, Income, Expenses, Daily, Balance.
- Record editor:
  - Supports income, fixed expense, and daily expense records.
  - Supports one or more values with label, amount, category, and optional recurring-value tag.
  - Makes record-level colors distinct from category colors.
  - Makes one-off value amount edits distinct from recurring tag amount edits.
  - Prevents save when all values are removed.
- Copy/paste:
  - Copy command stores an immutable sanitized record snapshot in frontend layout context and session storage.
  - Paste command calls the backend paste endpoint with the copied snapshot and target date.
  - Backend performs final authorization and duplication rules.

## Implementation Subtasks

### 1. Workspace Foundation

- Add root `package.json`, `pnpm-workspace.yaml`, `.editorconfig`, `.gitignore`, shared Prettier config, and root scripts.
- Add `frontend/` and `backend/` folders.
- Add current stable Node and pnpm documentation through `.nvmrc`, `packageManager`, and README setup notes.
- Add `compose.yaml` for local MongoDB configured as a single-node replica set for transaction support.
- Add root scripts:
  - `pnpm format`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `pnpm dev`
- Add initial CI workflow once the first scaffolded apps exist. CI should run install with frozen lockfile, formatting check, lint, typecheck, tests, build, and dependency audit gates before merge/release.

### 2. Frontend Scaffold

- Scaffold React + TypeScript with Vite under `frontend/`.
- Install latest stable frontend dependencies, including Tailwind CSS, shadcn/ui, TanStack Query, React Router, React Hook Form, Zod, Recharts, date/money helpers, and test tooling.
- Configure Tailwind and shadcn/ui using current official defaults.
- Add strict TypeScript config, ESLint, Prettier integration, Vitest, React Testing Library, MSW, and Playwright.
- Create the Feature-Sliced Design folder layout and path aliases.
- Add app bootstrap with providers for router, query client, theme, and authenticated user bootstrap.

### 3. Frontend Theme System

- Define semantic design tokens for light and dark themes.
- Wire Tailwind and shadcn/ui components to CSS variables.
- Add theme provider, theme toggle, persisted theme selection, and system-theme fallback.
- Add token documentation showing how to change palette, font family, and border radius from one place.
- Add a small visual test page or Storybook-like internal route only if useful during development; remove or hide it before V1 release unless intentionally kept.

### 4. Backend Scaffold

- Initialize backend TypeScript project under `backend/`.
- Install latest stable backend dependencies, including Fastify, official MongoDB Node.js driver, Zod or equivalent runtime validation, secure password hashing, cookie/session utilities, logging, and test tooling.
- Configure strict TypeScript, ESLint, Prettier, Vitest, Fastify in-process HTTP tests, and MongoDB integration test support.
- Add `src/app.ts`, `src/server.ts`, environment config validation, structured logger, error middleware, request id middleware, and health route.
- Add `backend/.env.example` with non-secret placeholders.

### 5. Database Connection And Indexes

- Implement MongoDB connection lifecycle.
- Add collection definitions and index creation.
- Add test database setup/teardown using `MongoMemoryReplSet` or an equivalent single-node replica-set test harness so transaction behavior is covered in automated tests.
- Add repository test fixtures for users, categories, recurring tags, and records.
- Verify indexes are created in local dev and test contexts.

### 6. Shared Domain Utilities

- Implement shared money utilities for parsing, formatting, and integer-cent arithmetic.
- Implement finance timezone utilities for GMT-3 date derivation, month boundaries, and full timestamp comparisons.
- Implement color validation utilities for `#RRGGBB` hex values and any controlled internal token set.
- Implement shared error types and HTTP error mapping.
- Add unit tests for money, date/time, and color validation edge cases.

### 7. Authentication Backend

- Implement sign-up, login, logout, refresh, and current-user endpoints.
- Hash passwords with Argon2id unless ecosystem constraints require a documented alternative.
- Store refresh token hashes, rotate refresh tokens, and clear cookies on logout.
- Implement the CSRF flow, cookie settings, refresh-token family tracking, refresh replay detection, and multi-tab refresh expectations from the auth/session contract.
- Add auth middleware that populates request user context.
- Ensure duplicate email, invalid credentials, expired refresh, and revoked refresh cases are covered.
- Add integration tests for auth success/failure paths, CSRF rejection, refresh replay, concurrent refresh behavior, logout revocation, and finance-data scoping guardrails.

### 8. Authentication Frontend

- Build sign-up and login pages with accessible shadcn/ui forms.
- Add auth API client, TanStack Query auth bootstrap, protected route handling, logout action, and redirect behavior.
- Add mobile and desktop layout checks for auth screens.
- Add tests for form validation, success navigation, and failed login messaging.

### 9. Categories Backend And Frontend

- Implement category CRUD API with user scoping and unique normalized names.
- On category delete, unlink the category from existing values so those values fall back to the uncategorized grouping without changing their amounts or labels.
- Build category selection, creation, and edit UI that can be used inside record value forms.
- Ensure category color/name changes are reflected anywhere category data is rendered through query invalidation.
- Add unit/integration tests for category validation, uniqueness, authorization, and uncategorized fallback behavior.

### 10. Recurring-Value Tags Backend

- Implement recurring-value tag CRUD API.
- On recurring-value tag delete, unlink the tag from existing values without changing their current saved amounts.
- Implement stored amount update with current/future linked-value propagation based on full `effectiveAt` timestamp in GMT-3 business rules.
- Ensure past linked values are never changed.
- Ensure tag update returns propagation summary, such as number of records and values affected, for UI feedback.
- Implement mandatory MongoDB transaction handling for tag amount updates and linked future-value propagation.
- Add tests for cutoff boundary, same-timestamp update, past records, future records, unlinked values, and cross-user isolation.

### 11. Recurring-Value Tags Frontend

- Build recurring-tag selector and create-from-value flow in the record value editor.
- Build UI that clearly distinguishes applying a tag's stored amount to one value from updating the shared tag amount.
- Add unlink action for a value.
- Add propagation confirmation or post-save summary if the implementation chooses that UX; this is allowed by the PRD's deferred question but should not block core behavior.
- Add tests around selecting, creating, applying, editing, and unlinking tags.

### 12. Records Backend

- Implement record create, read, update, delete, and paste endpoints.
- Validate record type, expense kind, effective timestamp, colors, values, category ids, recurring-tag ids, and at-least-one-value rule.
- Compute `financeDate` and `financeMonth` from `effectiveAt`.
- Implement copy/paste creation from a sanitized source snapshot, preserving all source record data except target date and optional target time.
- Ensure category and recurring-tag references belong to the same user.
- Add tests for income, fixed expense, daily expense, multi-value records, invalid empty records, invalid cross-user references, record color edits, and paste behavior.

### 13. Records Frontend

- Build reusable record card/cell rendering for table cells.
- Build record editor sheet/dialog with dynamic values list.
- Add income/fixed/daily classification controls.
- Add per-value amount, label, category, and recurring-tag fields.
- Add record-level font/background color controls.
- Add create, edit, delete, copy, and paste interactions.
- Ensure TanStack Query invalidates affected records, reports, charts, and month data after mutation.
- Add tests for editor validation, add/remove values, copy/paste UI, and query invalidation behavior.

### 14. Report And Balance Backend

- Implement shared aggregation service for daily rows, three-day rows, monthly rows, category breakdowns, and current-vs-previous-month daily balance series.
- Return income-by-category and expense-by-category totals separately. The home pie/donut chart should show both groups explicitly, preferably as two concentric rings on desktop and a segmented income/expenses toggle on constrained mobile layouts if the dual-ring chart becomes unreadable.
- Use value-level amounts for every total.
- Group records into Income, Expenses, and Daily columns based on `type` and `expenseKind`.
- Treat Balance as daily net amount, not running account balance.
- Include uncategorized values in category breakdowns.
- Add tests with multi-value records spanning multiple categories and recurring tags.

### 15. Shared Finance Table Frontend

- Build the shared 5-column finance table component.
- Support compact mobile rendering with expansion or drill-in for nested values.
- Ensure table rendering works for daily, three-day, and monthly datasets.
- Add empty states that preserve the table structure.
- Add tests for column order, record grouping, nested value display, and balance rendering.

### 16. Home Page Frontend

- Build desktop home layout with three PRD sections.
- Build mobile carousel variants for summary cards, charts, and tables.
- Render pie chart by value category and line chart comparing current vs previous month daily balances.
- Use the backend's separate income-by-category and expense-by-category totals for the pie/donut chart instead of mixing income and expense values into one ambiguous net category series.
- Ensure charts and summaries update after relevant mutations.
- Verify responsive behavior at representative mobile, tablet, and desktop widths.
- Add component and Playwright tests for primary home workflows.

### 17. Monthly View Frontend

- Build month navigation and selected-month state.
- Render every day from first through last day of selected month.
- Wire inline or modal editing from monthly records.
- Support paste onto a selected day.
- Ensure responsive behavior avoids unusable horizontal scrolling for primary actions.
- Add tests for month boundaries, leap years, navigation, record editing, and paste into target day.

### 18. App Shell And Navigation

- Build authenticated layout with collapsible sidebar.
- Show logged-in user's name, page links, create-record action, and logout.
- Add mobile sidebar behavior and floating action button.
- Ensure keyboard navigation, focus management, and aria labels for dialogs, sheets, menus, and carousels.
- Add tests for sidebar expand/collapse, navigation, logout, and mobile create action.

### 19. End-To-End Workflows

- Add Playwright tests for:
  - Sign up, logout, login.
  - Create income record with multiple values.
  - Create fixed expense and daily expense records.
  - Edit category color/name and observe UI update.
  - Copy a record and paste onto another day.
  - Update recurring tag amount and verify future values update while past values do not.
  - Home page desktop layout.
  - Home page mobile carousel layout.
  - Monthly view navigation and editing.

### 20. Observability, Error Handling, And Hardening

- Add structured backend request logging without sensitive payloads.
- Add structured audit/debug logs for recurring propagation and bulk unlink operations with request id, user id, tag/category id, cutoff instant, affected counts, and no sensitive labels/descriptions/amount payloads.
- Add consistent frontend error toasts or inline errors for failed mutations.
- Add rate limiting or brute-force protection for auth endpoints.
- Add request body size limits.
- Add secure CORS configuration for configured frontend origins.
- Add cookie security settings for dev and production.
- Add dependency audit commands to documentation and quality gates.

### 21. Privacy And Data Lifecycle

- Add a minimal account settings area if production use with real data is enabled.
- Add authenticated JSON export for the user's finance data, including records, values, categories, recurring tags, and profile metadata.
- Add account deletion that requires password confirmation and hard-deletes the user's records, categories, recurring tags, refresh tokens, and user profile.
- Keep normal record deletion as hard-delete for V1 unless a future recovery feature is explicitly requested.
- Add refresh-token TTL cleanup and document cleanup behavior.
- Document that analytics are out of scope for V1. If analytics are later added, finance amounts, labels, descriptions, category names, and recurring-tag names must not be sent as analytics properties.
- Before production use, add a privacy notice covering data categories, purpose, lawful basis or consent model, retention, deletion/export support, support contact, and third-party processors such as hosting, database, logging, and error reporting providers.
- Add tests for export authorization, account deletion, token invalidation after deletion, and deleted-user data isolation.

### 22. Documentation And Developer Experience

- Add root README with setup, environment variables, local MongoDB, scripts, testing, and troubleshooting.
- Add frontend and backend README notes only where app-specific guidance is useful.
- Add API route documentation, either in README or generated OpenAPI if the selected backend stack makes that low-cost.
- Document theme customization, data model rules, recurring tag propagation rules, and finance timezone handling.
- Document resolved dependency versions through committed lockfiles and setup notes when scaffolding/installing packages.

### 23. Final Integration And Polish

- Run the full quality gate.
- Fix lint, type, test, build, and responsive issues.
- Review mobile and desktop UX for overlap, overflow, touch target size, and readable table content.
- Verify no secrets are committed.
- Verify all PRD acceptance criteria have either automated coverage or a documented manual check.

## Files / Modules To Touch

- `docs/2026-04-25-personal-finance-system-v1/plan.md`: this implementation plan.
- `package.json`: root workspace scripts and package manager declaration.
- `pnpm-workspace.yaml`: workspace membership for `frontend` and `backend`.
- `.editorconfig`, `.gitignore`, Prettier/ESLint config files: shared development standards.
- `compose.yaml`: local MongoDB development service.
- `frontend/`: React SPA, Feature-Sliced source, UI, tests, and frontend tooling.
- `backend/`: Node API, domain modules, MongoDB access, tests, and backend tooling.
- `README.md`: setup and developer workflow documentation.

## Test Plan

Quality gates to add and run before V1 completion:

- `pnpm format`: check formatting across the workspace.
- `pnpm lint`: run frontend and backend ESLint.
- `pnpm typecheck`: run strict TypeScript checks for both apps.
- `pnpm test`: run frontend unit/component tests and backend unit/integration tests.
- `pnpm build`: build frontend and compile backend.
- `pnpm --filter frontend test:e2e`: run Playwright tests once end-to-end coverage exists.
- CI should run the same quality gate with frozen lockfile installation. Playwright may run in a separate job once e2e coverage exists.
- Backend auth, record, category, recurring-tag, and report integration tests should use an isolated test database and must verify cross-user isolation.
- Backend integration tests that cover recurring propagation or bulk unlinking must run against a MongoDB replica-set test harness so transactions are exercised.
- Date/time tests must cover GMT-3 day/month boundaries and recurring-tag propagation cutoff behavior.
- Money tests must cover integer-cent arithmetic and formatting/parsing edge cases.
- Frontend tests must cover validation, query invalidation, responsive rendering decisions, and critical user workflows.
- Security tests must cover CSRF failure, cross-user object access, refresh-token replay, oversized payload rejection, unsafe text rendering, invalid colors, and account deletion/export authorization.
- Manual checks should be limited to visual polish and responsive UX that cannot be reliably captured in automated tests.

## Security / Privacy / Compliance

- Finance records, categories, recurring tags, user profiles, and auth tokens are sensitive personal data.
- For approval, assume V1 may eventually store real personal finance data in a private production deployment. Production use requires the privacy/data lifecycle subtask, secure deployment settings, backup/restore notes, and provider review to be complete.
- Never log passwords, raw refresh tokens, auth cookies, or full finance payloads.
- Hash passwords with Argon2id using reviewed parameters at implementation time unless a documented ecosystem constraint requires an alternative.
- Store only refresh token hashes, rotate refresh tokens, track token families, detect refresh-token reuse, and revoke token families on replay.
- Use the auth/session contract's cookie names, lifetimes, SameSite policy, and CSRF flow. In local development, document any relaxed Secure-cookie settings explicitly.
- Restrict CORS to configured frontend origins.
- Add CSRF protection for authenticated mutating requests.
- Validate every request body, route parameter, and query parameter at the API boundary.
- Enforce the validation limits from this plan for string lengths, values per record, amount bounds, date ranges, colors, and request body sizes.
- Enforce `userId` scoping in every repository query and mutation.
- Prevent cross-user references to category ids, recurring-tag ids, and record ids.
- Store user-entered labels, descriptions, category names, and tag names as plain text only. Do not render user content with `dangerouslySetInnerHTML`; chart/table tooltips must render escaped text.
- Restrict user-controlled colors to safe hex values or controlled internal tokens; do not accept arbitrary CSS color strings.
- Use rate limiting or another brute-force mitigation on login and sign-up endpoints.
- Apply request size limits to prevent oversized record/value payloads.
- Keep environment variables out of git; provide `.env.example` only.
- Commit lockfiles, pin package-manager behavior, review scaffold-generated config/code before accepting it, and run dependency audits as part of pre-release checks. High/critical audit findings in runtime, auth, validation, or persistence dependencies must be fixed or explicitly accepted before release.
- Do not add analytics by default. If analytics are introduced later, finance amounts, labels, descriptions, category names, recurring-tag names, and free-text finance content must not be sent as analytics properties.

## Rollout / Rollback

- V1 has no existing production deployment or data migration, so rollout is initially local/development focused.
- Implement in small subtasks that keep the workspace buildable after each slice.
- Do not enable production deployment until auth cookie settings, CSRF behavior, CORS origins, environment variables, MongoDB connection security, HTTPS assumptions, privacy notice, data export/delete behavior, backup/restore expectations, and third-party providers are documented.
- For database changes during V1 development, reset local dev/test data rather than writing migrations until real user data exists.
- If a subtask fails, rollback is a normal git revert of that subtask's commit because there is no existing production state.
- Once production deployment is introduced, require a database backup before shipping any schema or propagation behavior against real finance data.

## Blocking Questions

None.

## Deferred Non-Blocking Questions

- Spreadsheet import remains out of V1 per the PRD's deferred non-blocking questions.
- Multi-record copy/paste remains out of scope unless explicitly added later; single-record copy/paste satisfies V1.
- Value-level colors remain deferred; V1 will implement record-level colors and category colors as required.

## Approval

Approved on 2026-04-25.
