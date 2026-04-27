# Frontend

React SPA for the Personal Finance System V1. The app uses Vite, TypeScript,
Tailwind CSS v4, shadcn/ui-style primitives, TanStack Query, React Router,
React Hook Form, Zod, Recharts, and Feature-Sliced Design.

## Development

```sh
cp frontend/.env.example frontend/.env
pnpm --filter @finances/frontend dev
```

The dev server listens on `http://127.0.0.1:5173`. Local development needs
`frontend/.env` with `VITE_API_BASE_URL=http://127.0.0.1:3000/api` so browser
requests reach the backend.

Useful commands:

```sh
pnpm --filter @finances/frontend lint
pnpm --filter @finances/frontend typecheck
pnpm --filter @finances/frontend test
pnpm --filter @finances/frontend build
pnpm --filter @finances/frontend test:e2e
```

Exact installed versions are resolved in the root `pnpm-lock.yaml`. Direct
runtime and development dependencies are listed in `frontend/package.json`.

## Structure

Source lives under `frontend/src`:

- `app`: bootstrap, providers, router, authenticated layout, and global styles.
- `pages`: route-level screens such as login, sign up, home, monthly, and not
  found.
- `widgets`: composed page regions such as the finance table.
- `features`: user actions such as auth, record editing, categories, recurring
  tags, copy/paste, and theme toggle.
- `entities`: finance domain types, query hooks, and small domain UI fragments.
- `shared`: API client, reusable UI primitives, formatting helpers, config, and
  test utilities.

Use the aliases from `vite.config.ts` (`@app`, `@pages`, `@widgets`,
`@features`, `@entities`, and `@shared`) instead of deep relative imports when a
cross-layer import is appropriate.

## API Client

`frontend/src/shared/api/http-client.ts` is the shared browser API client.

- Requests include cookies with `credentials: "include"`.
- Mutating requests fetch and send `X-CSRF-Token` automatically unless the call
  opts out.
- Refresh is centralized so concurrent 401s do not start multiple refresh
  requests.
- A `BroadcastChannel` keeps session refresh and clear events aligned across
  browser tabs when supported.
- Server errors are surfaced through `ApiError`; UI code should use
  `getApiErrorMessage` for consistent inline messaging.

## Theme Customization

Theme tokens live in `frontend/src/app/styles/theme.css` and are documented in
`frontend/THEME.md`.

Change colors, fonts, radii, chart colors, finance colors, table colors, and
sidebar colors by editing semantic CSS variables in `:root` and `.dark`. The
`@theme inline` block maps those variables into Tailwind utilities and shared UI
component classes.

Runtime theme selection is handled by `ThemeProvider`:

- Storage key: `personal-finance-theme`
- Modes: `light`, `dark`, and `system`
- Applied root state: `.dark`, `data-theme`, `data-theme-mode`, and
  `color-scheme`

## Testing

Unit and component tests use Vitest, jsdom, Testing Library, and MSW helpers:

```sh
pnpm --filter @finances/frontend test
```

End-to-end workflow tests use Playwright:

```sh
pnpm --filter @finances/frontend test:e2e
```

Playwright builds the app and serves the production preview at
`http://127.0.0.1:4173`. In sandboxed environments, the preview server may need
permission to bind the local port.

## Troubleshooting

- If API calls fail locally, confirm the backend is running and that
  `VITE_API_BASE_URL` matches the backend route prefix.
- With `VITE_API_BASE_URL=http://127.0.0.1:3000/api`, open the frontend on
  `http://127.0.0.1:5173` as well; mixing `localhost` and `127.0.0.1` can
  prevent SameSite cookies from being sent.
- If CORS blocks browser requests, update `FRONTEND_ORIGINS` in `backend/.env`
  with the exact frontend origin.
- If the UI appears to keep an old session in another tab, refresh the tab; auth
  state broadcasts depend on browser `BroadcastChannel` support.
- If theme changes do not appear, confirm the variable is defined in both
  `:root` and `.dark` when the token needs distinct light and dark values.
