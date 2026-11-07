# Source Structure

Agent rules for placing files under `src/`.

For rationale and examples, see [`docs/architecture/application-structure.md`](../docs/architecture/application-structure.md).

## Core rules

- Use the app/domain/shared structure consistently.
- Do not add new top-level folders under `src/` unless explicitly requested or no existing folder fits.
- Put route-only code under `app/`.
- Put business/domain-owned code under `domains/<domain>/`.
- Put only domain-neutral reusable code under `shared/`.
- Do not use `shared/` as a catch-all.

## Top-level ownership

- `app/`: Next.js routes, layouts, route handlers, loading/error/not-found files, and route-local code.
- `domains/`: business/domain code grouped by product concept.
- `shared/`: domain-neutral reusable building blocks.
- `proxy.ts`: Next.js proxy/middleware entrypoint.

## Route-local code

Place code under `app/` when it is only used by one route subtree.

Use private `_` folders for route-local implementation details:

- `_components/`
- `_hooks/`
- `_forms/`
- `_lib/`
- `_providers/`

Example:

```text
app/
  w/
    [workspaceSlug]/
      _components/
      _hooks/
      page.tsx
      (workspace)/
        [documentId]/
          _components/
          _hooks/
```

Route-local code should not be imported by `domains/` or `shared/`.

## Domains

Place code under `domains/<domain>/` when it belongs to a business concept.

Common domain folders:

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
```

Use `domains/<domain>/stores/` for state that is specific to that domain.

Examples:

- document tree expansion state belongs in `domains/document/stores/`
- document title draft state belongs in `domains/document/stores/`
- workspace preference state belongs in `domains/workspace-preference/`

Domain code may only import from:

- the same domain
- other domains through their public exports
- `shared/`

Domain code must not import route-local files from `app/**/_*`.

## Shared

Use `shared/` only for domain-neutral code reused across domains or routes.

Recommended folders:

```text
shared/
  ui/
  hooks/
  lib/
  stores/
```

Rules:

- `shared/ui/`: reusable UI primitives and cross-page components.
- `shared/hooks/`: generic hooks with no domain knowledge.
- `shared/lib/`: generic utilities, formatting, helpers, and adapters.
- `shared/stores/`: app-wide state only, not domain-specific state.

Examples of valid `shared/stores/` state:

- theme
- command palette
- sidebar shell state
- global toast queue
- app-wide modal state

Examples that do not belong in `shared/stores/`:

- document tree expansion
- document title draft
- workspace-specific document state
- subscription-specific state

Before adding code to `shared/`, check whether the file mentions a domain entity in its name, state, props, types, actions, persistence key, or filename. If it does, prefer `domains/<domain>/`.

If unsure between `app/` and `domains/`, choose `app/` when usage is route-local; choose `domains/` when the behavior models a product concept.

## Imports

Prefer imports that show ownership clearly:

- route-local code imports from nearby `_` folders, domains, and shared
- domain code imports from domains and shared
- shared code imports only from shared or external packages

Do not make `shared/` depend on `domains/` or `app/`.

## Moving code

When moving code:

- move every caller to the new import path
- remove obsolete aliases and old files
- keep behavior unchanged unless the task explicitly asks for behavior changes
- update tests that import the moved module
