# Design System

The design system is a shared Tailwind v4 token layer plus a set of copy-in UI primitives. It has no dedicated package, no Storybook, and no component gallery; the contract is enforced by convention and by code review.

The goal:

- one source of truth for color, radius, and surface tokens
- primitives that are shared by both Next.js apps instead of duplicated
- route and domain code that composes primitives, never forks them

## Contents

| Document | Covers |
| --- | --- |
| [Tokens](./tokens.md) | `@theme inline`, color groups, radius scale, typography, how apps consume the stylesheet |
| [Theme](./theme.md) | `createThemeProvider`, forced-light routes, `/share` bypass |
| [Primitives](./primitives.md) | primitive inventory, conventions, variant API, imports, adding a primitive |
| [Registry CLI](./registry-cli.md) | `components.json` wiring, `bunx shadcn add` routing, review rules |

## Overview

```text
packages/shared/
  components.json            # registry CLI config (shared workspace)
  styles/
    globals.css              # tokens (@theme inline, :root, .dark, base, components)
  src/
    components/
      ui/                    # shared primitives
      create-theme-provider.tsx

apps/app/
  components.json            # registry CLI config (app workspace)
  src/
    app/globals.css          # imports shared tokens, adds app-only CSS
    app/_components/theme-provider.tsx
    shared/ui/               # app-only primitives

apps/marketing/
  components.json            # registry CLI config (marketing workspace)
  src/
    app/globals.css          # imports shared tokens
    app/_components/theme-provider.tsx
    shared/ui/navigation-menu.tsx
```

| Layer | Location | Scope | Details |
| --- | --- | --- | --- |
| Tokens | `packages/shared/styles/globals.css` | both apps | [Tokens](./tokens.md) |
| Theme provider | `packages/shared/src/components/create-theme-provider.tsx` | both apps | [Theme](./theme.md) |
| Shared primitives | `packages/shared/src/components/ui/` | both apps | [Primitives](./primitives.md) |
| App primitives | `apps/app/src/shared/ui/` | app only | [Primitives](./primitives.md) |
| Marketing primitives | `apps/marketing/src/shared/ui/` | marketing only | [Primitives](./primitives.md) |
| Registry config | `packages/shared/components.json`, `apps/*/components.json` | CLI only | [Registry CLI](./registry-cli.md) |

## Gallery

`apps/app/src/app/design` is a dev-only gallery (`/design`) that renders the primitives from `packages/shared/src/components/ui` and `apps/app/src/shared/ui` with a Light/Dark/System switch. It returns 404 in production builds. It is the surface linked from [Primitives](./primitives.md).

`apps/app/tests/visual/design-gallery.spec.ts` screenshots it per theme and compares against committed baselines in `apps/app/tests/visual/design-gallery.spec.ts-snapshots/`.

```bash
bun run --cwd apps/app test:visual
bun run --cwd apps/app test:visual:update
```

Baseline filenames carry the platform (`design-gallery-light-darwin.png`, `design-gallery-light-linux.png`). A new platform needs its own baselines before the suite can gate CI.

The `Visual regression` workflow (`.github/workflows/visual.yml`) is manual: run it as-is to compare, or with `update: true` to regenerate baselines on the runner platform and download them from the `visual-baselines-linux` artifact.

## Known gaps

- Baselines exist for macOS only; the `Visual regression` workflow is manual until linux baselines are generated and committed.
- Light and dark palettes are maintained by hand, so a token added to one block can be forgotten in the other. Both blocks must change in the same commit.
- `packages/shared/src/components/ui/` and `apps/app/src/shared/ui/` both exist; which one owns a given primitive is convention only.
- The registry CLI cannot express route ownership, so blocks and templates still need manual relocation after `add`.
