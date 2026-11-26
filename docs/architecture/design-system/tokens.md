# Tokens

Part of the [design system](./design-system.md).

All design tokens live in `packages/shared/styles/globals.css`. Do not declare semantic colors in an app's `globals.css`.

## File structure

The stylesheet has four parts:

1. `@theme inline` — maps each CSS variable into a Tailwind utility namespace (`--color-*`, `--radius-*`, `--font-*`).
2. `:root` — light values.
3. `.dark` — dark values.
4. `@layer base` / `@layer components` — global element defaults and shared editor styles.

## Color tokens

| Group | Tokens |
| --- | --- |
| Surfaces | `background`, `foreground`, `surface`, `surface-foreground`, `card`, `card-foreground`, `popover`, `popover-foreground` |
| Accents | `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground` |
| Destructive | `destructive`, `destructive-solid`, `destructive-solid-foreground`, `destructive-solid-hover`, `destructive-surface`, `destructive-surface-foreground`, `destructive-surface-hover` |
| Form | `border`, `input`, `ring` |
| Data viz | `chart-1` … `chart-5` |
| Sidebar | `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` |
| Feature | `ai-chat-composer` |

Colors are OKLCH in `:root` and `.dark`, except the destructive-solid/surface family, which is hex for exact brand values. New tokens follow the OKLCH form and must be declared in both `:root` and `.dark`.

`surface` and `ai-chat-composer` are derived with `color-mix(in oklab, …)` so they track the dark palette automatically; do not replace them with literal colors.

## Radius scale

`--radius: 0.625rem` is the base; every other step is a multiple of it, and Tailwind's `rounded-sm|md|lg|xl|2xl|3xl|4xl` map to the scale.

| Token | Multiplier |
| --- | --- |
| `--radius-sm` | 0.6 |
| `--radius-md` | 0.8 |
| `--radius-lg` | 1.0 |
| `--radius-xl` | 1.4 |
| `--radius-2xl` | 1.8 |
| `--radius-3xl` | 2.2 |
| `--radius-4xl` | 2.6 |

Changing `--radius` rescales the whole system. Do not hardcode `rounded-[10px]`-style values; the existing primitives clamp with `rounded-[min(var(--radius-md),10px)]` when they need a ceiling.

## Typography

`--font-sans` is set by `next/font/google` in each app's `layout.tsx` (Geist, with Geist Mono as `--font-mono`). `--font-heading` aliases `--font-sans`. Tailwind's `font-sans`/`font-mono` utilities are the only supported entry points; do not name font families in components.

## How apps consume tokens

Both apps import the shared file and add only app-specific CSS on top.

`apps/app/src/app/globals.css`:

```css
@import "tailwindcss";
@import "shadcn/tailwind.css";
@import "tw-animate-css";
@import "@blocknote/core/fonts/inter.css";
@import "@blocknote/shadcn/style.css";

@source "../../node_modules/@blocknote/shadcn/dist/*.js";
@source "../../../../packages/shared/src";

@custom-variant dark (&:is(.dark *));

@import "@camille/shared/styles/globals.css";
```

Order matters: Tailwind and its plugins first, then `@source` declarations so the shared package's class names are scanned, then the token file.

`apps/marketing/src/app/globals.css` uses the same preamble and token import.

The app file additionally owns app-only CSS that must not leak to marketing:

- `.app-scrollbar` — thin themed scrollbars
- `.stream-tail`, `.stream-caret`, `@keyframes caret-blink` — streaming AI text treatment
- `pixel-on`, `shimmer-text` — loader animations
- `fade-in`
- a `prefers-reduced-motion` block that disables animation and the stream mask

Anything reusable by both apps belongs in `packages/shared/styles/globals.css` instead.

## Rules

- A new color, radius, or surface is a token in the shared stylesheet, not a literal in a component. See [Primitives](./primitives.md) for how primitives consume tokens.
- Tokens are consumed through Tailwind utilities (`bg-muted`, `border-input`, `rounded-lg`), never via `var(--…)` in class strings when a utility exists.
- Add the token to `:root` and `.dark` in the same commit; nothing verifies the pair.

---

[← Design System overview](./design-system.md)
