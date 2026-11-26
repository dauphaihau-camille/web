# Registry CLI

Part of the [design system](./design-system.md). Primitives are described in [Primitives](./primitives.md); token edits belong in [Tokens](./tokens.md).

Every workspace has a `components.json` so `bunx shadcn@4.12.0 add` routes files to the right place instead of guessing.

## Configuration

| Workspace | File | `ui` alias | `components` alias |
| --- | --- | --- | --- |
| shared | `packages/shared/components.json` | `@shared/components/ui` | `@shared/components` |
| app | `apps/app/components.json` | `@shared/components/ui` | `@/app/_components` |
| marketing | `apps/marketing/components.json` | `@shared/components/ui` | `@/app/_components` |

All three share:

- `style: "base-nova"` — the Base UI style. It matches the `@base-ui/react` primitives; the default Radix style would inject `radix-ui` dependencies and a second primitive convention.
- `baseColor: "neutral"` — the palette is OKLCH gray.
- `iconLibrary: "lucide"`.
- `tailwind.css` pointing at the shared stylesheet (`styles/globals.css` inside the package, `../../packages/shared/styles/globals.css` from an app), so token edits land in the single source of truth.

`packages/shared/tsconfig.json` maps `@shared/*` to `./src/*` so the CLI resolves aliases when run from the shared workspace.

## Commands

Run from the repo root with `-c`:

```bash
bunx shadcn@4.12.0 add button --dry-run -c apps/app
bunx shadcn@4.12.0 info -c packages/shared
```

`info -c <workspace>` is the cheap validity check after editing a `components.json`; it reports the resolved framework, style, base, icon library, and aliases.

## Routing

Verified with `--dry-run`:

- `registry:ui` items land in `packages/shared/src/components/ui/` from any workspace.
- `registry:component` / `registry:block` files land in the app's `src/app/_components/`; pages they generate land under `src/app/`. Move both to the route's `_components/` folder per `application-structure.md`.
- `registry:lib` / hook items resolve through the `lib` and `hooks` aliases (`@shared/lib`, `@/shared/hooks`).

## Rules

- Always inspect with `--dry-run` or `--diff` before applying. The registry is upstream of these primitives, so a plain `add` reports `overwrite` for files that carry local additions (`publish` and `destructive-solid` button variants, `icon-xl`, `nativeButton`/`render` passthrough, `destructive-surface` tokens). Merge by hand.
- Never let the CLI rewrite `packages/shared/styles/globals.css` tokens wholesale; it would replace the custom palette with registry defaults.
- Add or update the primitives you touched in the [Primitives](./primitives.md) inventory.
- Keep `style`, `baseColor`, and `iconLibrary` identical across the three files; the CLI resolves cross-workspace imports from them.

---

[← Design System overview](./design-system.md)
