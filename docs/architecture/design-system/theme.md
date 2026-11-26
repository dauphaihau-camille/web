# Theme

Part of the [design system](./design-system.md). Tokens live in [Tokens](./tokens.md).

`createThemeProvider(shouldForceLightTheme)` wraps `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, and `disableTransitionOnChange`.

It lives at `packages/shared/src/components/create-theme-provider.tsx`.

## Behavior

Two behaviors are baked into the factory:

- `/share` and `/share/*` bypass the provider entirely and stay light — shared documents must not inherit a dark preference.
- Each app passes a predicate for routes that must render light.

| App | Forced-light routes |
| --- | --- |
| app | `/` and `authRoutes.isAuthPath(pathname)` |
| marketing | `/`, `/login`, `/signup` |

## Per-app provider

Each app owns a one-line provider file that supplies only its predicate:

`apps/app/src/app/_components/theme-provider.tsx`:

```tsx
'use client';

import { createThemeProvider } from '@shared/components/create-theme-provider';
import { authRoutes } from '@/domains/auth';

function shouldForceLightTheme(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return pathname === '/' || authRoutes.isAuthPath(pathname);
}

export default createThemeProvider(shouldForceLightTheme);
```

`apps/marketing/src/app/_components/theme-provider.tsx` follows the same shape with `'/'`, `'/login'`, `'/signup'`.

Apps wrap their root layout with that provider.

## Rules

- Do not add a second `next-themes` provider or a separate `attribute` strategy; the class-based dark mode is what the tokens in [Tokens](./tokens.md) target.
- Do not special-case `/share` in an app; that bypass lives in the shared factory so both apps behave the same.
- Keep each app's predicate limited to its own routes; forcing light is a route policy, not a component concern.
- Components never call `useTheme` for initial theme decisions; they consume token utilities and let the provider own the class.

---

[← Design System overview](./design-system.md)
