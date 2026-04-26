# Backend

Fastify API for the Personal Finance System V1. Code is organized by domain
module with controller, service, repository, schemas, and tests kept together
under `backend/src/modules`.

## Development

```sh
cp backend/.env.example backend/.env
docker compose up -d mongodb
pnpm --filter @finances/backend dev
```

The API listens on `HOST` and `PORT`, defaulting to
`http://127.0.0.1:3000`. Startup connects to `MONGODB_URI` and creates MongoDB
indexes before registering authenticated finance routes.

Useful commands:

```sh
pnpm --filter @finances/backend lint
pnpm --filter @finances/backend typecheck
pnpm --filter @finances/backend test
pnpm --filter @finances/backend build
```

Exact installed versions are resolved in the root `pnpm-lock.yaml`. Direct
runtime and development dependencies are listed in `backend/package.json`.

## Environment

`backend/.env.example` contains every supported backend setting.

- `NODE_ENV`: `development`, `test`, or `production`.
- `HOST` and `PORT`: Fastify listen address.
- `LOG_LEVEL`: console logger level.
- `MONGODB_URI`: MongoDB database URI. Local development expects a replica set.
- `COOKIE_SECRET`: required 32+ character secret for signed cookies and derived
  token signatures.
- `FRONTEND_ORIGINS`: comma-separated exact CORS allowlist for credentialed
  browser requests.
- `AUTH_RATE_LIMIT_WINDOW_MS` and `AUTH_RATE_LIMIT_MAX_ATTEMPTS`: in-memory
  brute-force protection for public auth endpoints.

## Auth And CSRF

The backend uses signed, httpOnly cookies:

- `__Host-finance_access`
- `__Host-finance_refresh`

Cookies use `Path=/`, SameSite=Lax, and Secure in production. Development keeps
Secure off so local HTTP testing works.

Mutating authenticated routes require the `X-CSRF-Token` header. Fetch a token
from `GET /api/auth/csrf` after login or signup. `POST /api/auth/refresh`
rotates refresh tokens and returns a fresh authenticated session.

Most successful responses are JSON objects. Errors use this shape when handled
by the shared error layer:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message.",
    "requestId": "req_..."
  }
}
```

## API Routes

All finance routes are scoped to the authenticated user.

| Method   | Path                                         | Auth           | CSRF | Description                                          |
| -------- | -------------------------------------------- | -------------- | ---- | ---------------------------------------------------- |
| `GET`    | `/health`                                    | No             | No   | Service health payload.                              |
| `POST`   | `/api/auth/signup`                           | No             | No   | Create user and session.                             |
| `POST`   | `/api/auth/login`                            | No             | No   | Create session.                                      |
| `POST`   | `/api/auth/logout`                           | Yes            | Yes  | Revoke refresh token when present and clear cookies. |
| `POST`   | `/api/auth/refresh`                          | Refresh cookie | No   | Rotate refresh token family and set new cookies.     |
| `GET`    | `/api/auth/csrf`                             | Yes            | No   | Return `{ "csrfToken": "..." }`.                     |
| `GET`    | `/api/auth/me`                               | Yes            | No   | Return the current safe user.                        |
| `GET`    | `/api/categories`                            | Yes            | No   | List categories by normalized name.                  |
| `POST`   | `/api/categories`                            | Yes            | Yes  | Create category.                                     |
| `PATCH`  | `/api/categories/:categoryId`                | Yes            | Yes  | Update category name and/or colors.                  |
| `DELETE` | `/api/categories/:categoryId`                | Yes            | Yes  | Delete category and unlink matching record values.   |
| `GET`    | `/api/recurring-tags`                        | Yes            | No   | List recurring value tags by normalized name.        |
| `POST`   | `/api/recurring-tags`                        | Yes            | Yes  | Create recurring value tag.                          |
| `PATCH`  | `/api/recurring-tags/:tagId`                 | Yes            | Yes  | Rename recurring value tag.                          |
| `PATCH`  | `/api/recurring-tags/:tagId/amount`          | Yes            | Yes  | Update amount and propagate to future linked values. |
| `DELETE` | `/api/recurring-tags/:tagId`                 | Yes            | Yes  | Delete tag and unlink matching record values.        |
| `GET`    | `/api/records?from=YYYY-MM-DD&to=YYYY-MM-DD` | Yes            | No   | List records in a finance-date range.                |
| `POST`   | `/api/records`                               | Yes            | Yes  | Create record.                                       |
| `POST`   | `/api/records/paste`                         | Yes            | Yes  | Paste a copied/snapshotted record onto another day.  |
| `GET`    | `/api/records/:recordId`                     | Yes            | No   | Fetch one record.                                    |
| `PATCH`  | `/api/records/:recordId`                     | Yes            | Yes  | Update record fields or values.                      |
| `DELETE` | `/api/records/:recordId`                     | Yes            | Yes  | Hard-delete one record.                              |
| `GET`    | `/api/reports/home?date=YYYY-MM-DD`          | Yes            | No   | Home report for the selected finance date.           |
| `GET`    | `/api/reports/month?month=YYYY-MM`           | Yes            | No   | Monthly report rows.                                 |

### Common Bodies

Signup:

```json
{
  "name": "Jane Example",
  "email": "jane@example.com",
  "password": "a-long-local-password"
}
```

Category:

```json
{
  "name": "Groceries",
  "fontColor": "#111827",
  "backgroundColor": "#d1fae5"
}
```

Recurring tag:

```json
{
  "name": "Rent",
  "amountCents": 250000
}
```

Record:

```json
{
  "effectiveDate": "2026-04-25",
  "effectiveTime": "09:30",
  "type": "expense",
  "expenseKind": "fixed",
  "description": "April housing",
  "fontColor": "#111827",
  "backgroundColor": "#e5e7eb",
  "values": [
    {
      "label": "Rent",
      "amountCents": 250000,
      "categoryId": "64f000000000000000000001",
      "recurringValueTagId": "64f000000000000000000002",
      "sortOrder": 0
    }
  ]
}
```

Income records use `"type": "income"` and must omit `expenseKind` or set it to
`null`. Expense records require `expenseKind` as `fixed` or `daily`.

Paste record:

```json
{
  "sourceRecordId": "64f000000000000000000003",
  "sourceSnapshot": {
    "type": "expense",
    "expenseKind": "daily",
    "description": "Lunch",
    "fontColor": "#111827",
    "backgroundColor": "#fee2e2",
    "values": [
      {
        "label": "Meal",
        "amountCents": 3500,
        "sortOrder": 0
      }
    ]
  },
  "targetDate": "2026-04-26",
  "targetTime": "12:00"
}
```

## Data Model Rules

- Finance data is stored in `users`, `refreshTokens`, `categories`,
  `recurringValueTags`, and `records`.
- Every finance collection query must include `userId`.
- Money is stored as positive integer cents. Floating-point amounts are not
  persisted.
- A record contains one to fifty embedded values.
- Record totals are computed from embedded values and are not stored as a
  mutable total.
- Expense records require `expenseKind`; income records must not have one.
- Values may reference zero or one category and zero or one recurring value tag.
- Category and recurring-tag names are unique per user after trim/lowercase
  normalization.
- Colors are data values validated by the shared color helpers.
- Record deletion is a hard delete for V1.
- Category and recurring-tag deletion hard-deletes the deleted object and
  unsets matching embedded value references so historical finance amounts and
  labels remain.
- Refresh tokens have a TTL index on `expiresAt`.

## Finance Timezone

Finance business dates use `America/Fortaleza`, matching the V1 GMT-3
requirement. API date inputs are plain strings:

- Dates: `YYYY-MM-DD`
- Months: `YYYY-MM`
- Times: `HH:mm`

When a record is created without an explicit time, the backend stores it at
`23:59:59.999` in the finance timezone. This keeps same-day planned recurring
values in the current/future propagation window for the whole finance day.

The backend stores UTC instants in MongoDB and derives `financeDate` and
`financeMonth` from the finance timezone.

## Recurring Tag Propagation

Updating a recurring tag amount captures one server-side cutoff instant.

- The tag stores the new `amountCents` and `lastAmountUpdatedAt`.
- Linked values in records with `effectiveAt >= cutoffAt` receive the new
  amount.
- Linked values before the cutoff are preserved.
- The update runs in a MongoDB transaction and returns propagation counts:
  `affectedRecordCount`, `affectedValueCount`, `skippedPastValueCount`, and
  `cutoffAt`.

Deleting a recurring tag runs in a transaction, deletes the tag, and unsets that
tag reference from linked record values.

## Observability And Hardening

The app has a local structured logger that writes JSON lines through
`console.log`. Request logs omit request and response payloads. Audit logs for
recurring propagation and category/tag unlink operations include request id,
user id, object ids, cutoff or unlink instant, and counts; they intentionally do
not include finance labels, descriptions, or amounts.

Fastify is configured with a 256 KB body limit, Helmet, credentialed exact-origin
CORS, signed cookies, refresh-token rotation, CSRF checks for mutating routes,
and in-memory auth rate limiting.

## Troubleshooting

- If startup fails with an invalid environment error, check `backend/.env`
  against `backend/.env.example`.
- If MongoDB transactions fail locally, confirm `docker compose up -d mongodb`
  is running and `MONGODB_URI` includes `replicaSet=rs0`.
- If browser requests fail preflight, add the exact frontend origin to
  `FRONTEND_ORIGINS`.
- If tests fail with port binding errors in a sandbox, rerun them where local
  port binding is allowed.
