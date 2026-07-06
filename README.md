# Camille Web

Frontend monorepo for `camille-v2`.

## Apps

- [`apps/app`](/Volumes/Local/dev/pj-personal/apps/camille/camille-v2/apps/web/apps/app): product app for `app.<domain>`
- [`apps/marketing`](/Volumes/Local/dev/pj-personal/apps/camille/camille-v2/apps/web/apps/marketing): marketing and public share routes for the main domain

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/v1`.
3. Start the API first so auth and workspace requests resolve.
4. Run `npm run dev:app` for the product app.
5. Run `npm run dev:marketing` for the marketing site.

## Useful scripts

- `npm run typecheck:app`
- `npm run typecheck:marketing`
- `npm run build:app`
- `npm run build:marketing`

Netlify setup notes live in [`NETLIFY.md`](/Volumes/Local/dev/pj-personal/apps/camille/camille-v2/apps/web/NETLIFY.md).
