# Camille Web

Frontend monorepo for `camille-v2`.

## Apps

- [`apps/app`](/Volumes/Local/dev/pj-personal/apps/camille/camille-v2/apps/web/apps/app): product app for `app.<domain>`
- [`apps/marketing`](/Volumes/Local/dev/pj-personal/apps/camille/camille-v2/apps/web/apps/marketing): marketing and public share routes for the main domain

## Implemented Patterns and Capabilities

### Architecture

- **Monorepo with app and shared-package boundaries** - the frontend workspace keeps the product app, marketing app, and reusable UI/API utilities separated under `apps/` and `packages/shared/`
- **Next.js App Router structure** - both apps use the App Router with route-grouped layouts, loading states, and colocated route components
- **Feature-oriented frontend domains** - app behavior is organized around domain folders such as `document`, `favorite`, `search`, `teamspace`, and `workspace-preference` instead of a flat component-only structure
- **Shared API client seams** - `packages/shared` centralizes API server/client setup, public env access, and common request helpers so both apps use the same transport conventions
- **Schema-backed request typing** - request and response shapes are modeled with Zod-backed schemas and per-domain API types
- **Client state split by responsibility** - TanStack Query handles server state while focused local UI state uses small Zustand stores where persistence or cross-component coordination is needed

### Product Surface

- **Workspace application shell** - the main app includes authenticated workspace routing, shared shell components, and per-workspace layouts
- **Auth entry flows** - login, signup, and OAuth popup routes are implemented in the product app
- **Document workspace experience** - the app includes document routes, tree navigation, favorites, trash flows, and search entry points
- **Rich text editor foundation** - both apps share a BlockNote-based editor setup with custom slash menu, side menu, drag handle actions, and subdocument block support
- **Published share routes** - the marketing app serves public document-share pages under `/share/[publishedDocumentId]`
- **Workspace settings surface** - settings and member-management routes are already present in the product app

### UI and Frontend Platform

- **Shared design primitives** - reusable UI components live in `packages/shared/src/components/ui` for buttons, dialogs, menus, tables, tabs, tooltips, and related building blocks
- **App-level providers** - query, theme, and app provider composition is established in both apps
- **Optimistic UI for key document actions** - favorites, archive and restore flows, and title editing update local caches immediately with rollback paths on mutation failure
- **Latest-wins autosave queue** - document title and content saves use a serialized single-flight queue so overlapping requests cannot let stale responses overwrite newer local edits
- **Responsive sidebar and command-style interactions** - the workspace shell includes sidebar, sheet, dropdown, and command-style UI patterns for dense product navigation
- **Theme support** - both apps are wired with `next-themes`-based theme providers
- **Service worker foundation** - the product app includes a web push service worker entrypoint at `apps/app/public/web-push-sw.js`

### Quality and Delivery

- **Component and integration testing** - Vitest and Testing Library cover UI helpers, forms, and workflow-focused integration paths
- **Mocked API test harness** - MSW and a local mock API server support isolated frontend tests without requiring the backend for every scenario
- **Playwright end-to-end coverage** - the product app includes e2e coverage for smoke, login, and workspace-entry flows
- **Typecheck, lint, and monorepo build scripts** - the workspace exposes shared scripts for typechecking, linting, testing, and building both apps
- **Turborepo task graph** - Turbo coordinates monorepo build and typecheck tasks across the product app, marketing app, and shared package dependency graph
- **Netlify deployment configuration** - each Next.js app carries its own `netlify.toml`, with workspace notes in [`NETLIFY.md`](/Volumes/Local/dev/pj-personal/apps/camille/camille-v2/apps/web/NETLIFY.md)

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` and `NEXT_PUBLIC_API_VERSION=v1`.
3. Start the API first so auth and workspace requests resolve.
4. Run `npm run dev:app` for the product app.
5. Run `npm run dev:marketing` for the marketing site.

## Useful scripts

- `npm run typecheck:app`
- `npm run typecheck:marketing`
- `npm run build:app`
- `npm run build:marketing`

Netlify setup notes live in [`NETLIFY.md`](/Volumes/Local/dev/pj-personal/apps/camille/camille-v2/apps/web/NETLIFY.md).
