# Camille Web

Next.js frontend for `camille-v2`.

## Phase 0 decisions

- Keep the existing `src/app` structure and domain folders as scaffolding.
- Treat Camille v1 as the UX reference surface.
- Use `document` and `teamspace` as fixed product terms.
- Authenticate against the API over http-only cookies and load app state through REST queries.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/v1`.
3. Start the API first so auth and workspace requests resolve.
4. Run `npm run dev`.

The current login page is [src/app/login/page.tsx](/Volumes/Local/dev/pj-personal/apps/camille/camille-v2/apps/web/src/app/login/page.tsx). It uses the backend-owned passwordless flow via `POST /auth/email/start` and `POST /auth/email/verify`, then relies on the backend cookie session.
