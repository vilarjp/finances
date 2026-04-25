# Frontend Theme Tokens

Theme customization lives in `frontend/src/app/styles/theme.css`.

## Change The Palette

Edit the semantic CSS variables in both `:root` and `.dark`.

- App surface tokens: `--background`, `--foreground`, `--card`, `--popover`, `--border`, `--input`, and `--ring`.
- Action tokens: `--primary`, `--secondary`, `--accent`, `--destructive`, and their `*-foreground` pairs.
- Finance tokens: `--finance-income`, `--finance-expense`, `--finance-daily`, `--finance-balance-positive`, and `--finance-balance-negative`.
- Chart tokens: `--chart-1` through `--chart-5`.
- Record/table/sidebar tokens: `--record-*`, `--table-*`, and `--sidebar-*`.

The `@theme inline` block maps these variables into Tailwind utilities and shadcn/ui component colors, so changing the semantic variables updates the app without editing component classes.

## Change The Font

Update `--font-family-sans` in `:root`. The base stylesheet and Tailwind `font-sans` token both read from that value.

## Change Border Radius

Update `--radius` in `:root`. Tailwind radius tokens derive from it:

- `rounded-sm`: `--radius - 4px`
- `rounded-md`: `--radius - 2px`
- `rounded-lg`: `--radius`
- `rounded-xl`: `--radius + 4px`

Keep card and control radii at or below the project design target unless a future design update changes that constraint.

## Theme Selection

Runtime theme mode is managed by `ThemeProvider` and `ThemeModeToggle`.

- Storage key: `personal-finance-theme`
- Modes: `light`, `dark`, and `system`
- The provider applies `.dark`, `data-theme`, `data-theme-mode`, and `color-scheme` on the document root.
