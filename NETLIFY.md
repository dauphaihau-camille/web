# Netlify Setup

This frontend repo is a monorepo rooted at [`apps/web`](/Volumes/Local/dev/pj-personal/apps/camille/camille-v2/apps/web).

Create two Netlify sites from the same repository.

## Site 1: app subdomain

- Base directory: `apps/web`
- Package directory: `apps/app`
- Build command: `npm run build:app`
- Domain: `app.<your-domain>`

## Site 2: main domain

- Base directory: `apps/web`
- Package directory: `apps/marketing`
- Build command: `npm run build:marketing`
- Domain: `<your-domain>`

## Notes

- Netlify's monorepo docs support leaving the repository root as the default install/build root, or setting a narrower base directory for the frontend workspace. Here we use `apps/web` as the base because that is where the lockfile and frontend dependencies live.
- Netlify's package directory setting should point to the individual app folder so each site picks up its own `netlify.toml`.
- Next.js is supported on Netlify via the OpenNext adapter with zero extra framework configuration.
