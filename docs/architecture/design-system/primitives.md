# Primitives

Part of the [design system](./design-system.md). Colors and radius come from [Tokens](./tokens.md); installation is covered in [Registry CLI](./registry-cli.md).

Primitives are vendored shadcn-style components, but the headless base is `@base-ui/react`, not Radix. They follow the same shape:

- `cva` for variants
- `cn` from `@shared/lib/utils` for class merging
- `data-slot="<name>"` on the root element
- named exports, including the variant function when callers need it

## Shared primitives — `packages/shared/src/components/ui/`

Representative entries; list the directory for the full set.

| File | Notable exports |
| --- | --- |
| `button.tsx` | `Button`, `buttonVariants` |
| `badge.tsx` | `Badge`, `badgeVariants` |
| `input.tsx` | `Input`, `inputVariants` |
| `dialog.tsx` | `Dialog` and parts |
| `tooltip.tsx` | `Tooltip` and parts |
| `empty.tsx` | empty-state composition |
| `sonner.tsx` | `Toaster` |

## App primitives — `apps/app/src/shared/ui/`

Representative entries.

| File | Notable exports |
| --- | --- |
| `sidebar.tsx` | `Sidebar` and parts, `SidebarProvider`, `useSidebar` |
| `field.tsx` | `Field`, `FieldLabel`, `FieldError` and form-layout parts |
| `command.tsx` | `cmdk` command palette |
| `message-scroller.tsx` | chat scroll container with jump-to-bottom |
| `tabs.tsx` | `Tabs` and parts |

Marketing has `navigation-menu.tsx` only.

Every primitive listed here is rendered at `/design` in development (`apps/app/src/app/design`), which is what the [visual regression suite](./design-system.md#gallery) screenshots. Add a section there when you add a primitive so it is covered.

These live in the app because they depend on app-only state (for example `sidebar.tsx` uses `@/shared/hooks/use-mobile`) or are only needed by one app. Move a primitive into `packages/shared/src/components/ui/` when marketing genuinely needs it, and update both apps' imports in the same change.

## Variant API

Variants are the public API; `className` is the escape hatch for layout only.

`buttonVariants` variants: `default`, `publish`, `destructive-solid`, `outline`, `secondary`, `ghost`, `destructive`, `link`.

`buttonVariants` sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`, `icon-xl`.

`badgeVariants` variants: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`.

`inputVariants` sizes: `default`, `xs`, `sm`, `lg`.

`InputProps` omits the native `size` attribute so `VariantProps` can own it.

Rules:

- A new visual treatment is a new variant in the owning `cva` definition, not a `className` override at the call site.
- `className` handles spacing, width, and positioning, not color, border, radius, or font weight.
- Every color/radius value comes from a token utility (`bg-muted`, `text-muted-foreground`, `border-input`, `rounded-lg`). No literal `oklch(...)`, hex, or arbitrary `text-[13px]` in component code.
- Dark mode is expressed by token pairs first; `dark:` is only for behavioral differences the tokens can't carry (for example `dark:bg-input/30`).
- Focus treatment is `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`; invalid state is `aria-invalid:*` with the destructive tokens. Do not invent alternative focus rings.

## Imports

Both apps alias `@shared/*` to `packages/shared/src/*` (`apps/app/tsconfig.json`, `apps/marketing/tsconfig.json`); `packages/shared/tsconfig.json` maps the same alias to `./src/*` for its own tooling.

| What | Import |
| --- | --- |
| Shared primitive | `import { Button } from '@shared/components/ui/button'` |
| App primitive | `import { Sidebar } from '@/shared/ui/sidebar'` |
| Utilities | `import { cn } from '@shared/lib/utils'` |
| Tokens | `@import "@camille/shared/styles/globals.css"` |

There is no barrel file for `components/ui`. Import the concrete module so tree-shaking and Turbo caching stay predictable.

## Adding a primitive

1. Default to `packages/shared/src/components/ui/<name>.tsx` so both apps can use it. `bunx shadcn@4.12.0 add <name> --dry-run -c apps/app` already routes there — see [Registry CLI](./registry-cli.md).
2. Use the shared conventions: `cva`, `cn`, `data-slot`, `@base-ui/react` primitive, token-only classes.
3. Add it to the inventory table above.
4. If it introduces a color or radius that tokens cannot express, add the token to `packages/shared/styles/globals.css` in both `:root` and `.dark` first.
5. Put app-only primitives in `apps/app/src/shared/ui/` and keep them out of `packages/shared` until a second app needs them.

---

[← Design System overview](./design-system.md)
