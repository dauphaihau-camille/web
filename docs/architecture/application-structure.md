# Application Structure

The application uses an app/domain/shared structure inspired by Feature-Sliced Design.

The goal is clear ownership:

- route code lives near the route that uses it
- business concepts live in domains
- reusable domain-neutral primitives live in shared

This keeps page-specific implementation out of global folders and prevents `shared/` from becoming a catch-all.

## Overview

```text
src/
  app/
  domains/
  shared/
  proxy.ts
```

## `app/`

`app/` contains Next.js application routes and route-level composition.

Use it for:

- `page.tsx`
- `layout.tsx`
- `loading.tsx`
- `error.tsx`
- `not-found.tsx`
- route handlers
- metadata files
- route-specific components, hooks, forms, providers, and helpers

Route-specific code should be co-located under private `_` folders:

```text
app/
  w/
    [workspaceSlug]/
      page.tsx
      layout.tsx
      _components/
      _hooks/
      _providers/
      _lib/
```

A file belongs in `app/` when it is only useful inside that route subtree.

Route-local files should not become implicit shared APIs. If another route needs the same behavior, move the code to the correct domain or to `shared/`.

## `domains/`

`domains/` contains business concepts.

A domain owns product-specific behavior, state, APIs, types, cache logic, mutations, and domain-specific UI.

Example:

```text
domains/
  document/
    api/
    cache/
    actions/
    hooks/
    components/
    stores/
    index.ts

  workspace/
    api/
    hooks/
    index.ts

  subscription/
    api/
    hooks/
    components/
    index.ts
```

Use domain folders for code that answers “what product concept owns this?”

Examples:

| Code | Location |
| --- | --- |
| document API requests | `domains/document/api/` |
| document query cache | `domains/document/cache/` |
| document-specific hooks | `domains/document/hooks/` |
| document-specific components | `domains/document/components/` |
| document tree expansion store | `domains/document/stores/` |
| document title draft store | `domains/document/stores/` |
| workspace routes/helpers | `domains/workspace/` |
| subscription gates and plans | `domains/subscription/` |

### Domain stores

Stores belong in a domain when their state is tied to that domain.

For example, document tree expansion is not global application state. It stores document navigation UI state by workspace and tree scope, so the document domain should own it.

Document title draft state is also document-specific because it tracks an active document and its draft title.

Preferred structure:

```text
domains/
  document/
    stores/
      document-tree-expansion-store.ts
      document-title-draft-store.ts
```

## `shared/`

`shared/` contains reusable domain-neutral building blocks.

Recommended structure:

```text
shared/
  ui/
  hooks/
  lib/
  stores/
```

Use `shared/` only when the code has no business-domain ownership.

### `shared/ui/`

Reusable UI primitives and cross-page components.

Examples:

- button
- dialog
- dropdown menu
- tooltip
- input
- skeleton
- app-neutral layout primitives

### `shared/hooks/`

Generic hooks with no domain knowledge.

Examples:

- `use-mobile`
- `use-debounce`
- `use-event-listener`
- `use-controllable-state`

A hook that knows about documents, workspaces, subscription, auth, or teamspaces belongs in that domain.

### `shared/lib/`

Generic utilities and infrastructure helpers.

Examples:

- `cn`
- date formatting helpers
- string utilities
- URL helpers with no domain ownership
- generic client adapters

Domain-specific utilities belong in their domain.

### `shared/stores/`

Only app-wide, domain-neutral state belongs here.

Valid examples:

- theme store
- command palette store
- global sidebar shell store
- global toast queue
- app-wide modal registry

Invalid examples:

- document tree expansion store
- document title draft store
- workspace preference store
- subscription checkout state
- search filter state tied to the search domain

If a store mentions a domain entity in its state shape, actions, persistence key, or filename, it probably belongs in that domain.

## Import direction

Keep dependencies flowing inward:

```text
app -> domains -> shared
app -> shared
domains -> shared
```

Avoid these imports:

```text
shared -> domains
shared -> app
domains -> app
```

Route-local `_` folders are private to their route subtree. Do not import them from domains, shared, or unrelated routes.

## Public APIs

Each domain may expose a public API from `index.ts`.

Prefer importing domain-owned types and functions through the domain public export when the symbol is intended for external use:

```ts
import type { Document } from '@/domains/document';
```

Internal implementation files can stay directly imported inside the same domain.

Do not expose everything by default. Export only the symbols that other domains or routes need.

## Placement checklist

When adding a file, choose the first matching location:

1. Used by one route subtree only?
   - Put it under `app/<route>/_components`, `_hooks`, `_lib`, etc.

2. Owned by a business concept?
   - Put it under `domains/<domain>/`.

3. Reused and domain-neutral?
   - Put it under `shared/`.

4. Truly application entrypoint/configuration?
   - Keep it at the appropriate framework-defined location.

## Migration rule

When moving existing code:

- move all imports in the same change
- update tests
- remove the old file
- avoid compatibility aliases unless there is an explicit migration requirement
- keep runtime behavior unchanged

A clean cutover is preferred over duplicate paths.
