# Web Agent Notes

Follow the focused rules in [`agent-skills/`](./agent-skills/).

Current rules:
- [`agent-skills/src-structure.md`](./agent-skills/src-structure.md): place source files under `app/`, `domains/`, and `shared/` ownership.
- [`agent-skills/co-located-files.md`](./agent-skills/co-located-files.md): keep page-specific files under `app/` route-local folders.

## API Types

API request and response types come from the published
`@dauphaihau-camille/api-spec` OpenAPI contract. The generated module is
committed at `packages/shared/src/api/generated/openapi.d.ts`. Never edit
generated files.

```bash
bun run generate:api-types
bun run generate:api-types -- --check
```

- Adopting a new published contract version is automated:
  `.github/workflows/contract-update.yml` runs daily, bumps the pinned
  devDependency, regenerates the types, opens or updates a
  `contract/api-spec-<version>` pull request titled
  `chore(deps): adopt contract <version>`, and dispatches CI on it. It never
  merges and never publishes; review the generated diff and merge manually.
- Manual fallback only (for example when the workflow cannot reach the
  registry): `bun add -D --save-exact @dauphaihau-camille/api-spec@<version>`
  then `bun run generate:api-types`, and commit `package.json`, `bun.lock` and
  the generated types together. Do not hand-fix types. The spec resolves from
  `--spec <path>`, then `API_SPEC_PATH`, then
  `node_modules/@dauphaihau-camille/api-spec/openapi.json`. The offline
  `API_SPEC_PATH=../api/api/openapi.json` form is only for bootstrapping a
  checkout that has neither the package nor registry access.
- Installing the package needs `NODE_AUTH_TOKEN` with `read:packages` for the
  `dauphaihau-camille` account (see `.npmrc`). A registry `404` means the token
  cannot see the package, not that the package is missing.
- The `contract` CI job runs `bun run generate:api-types -- --check` against the
  committed artifact with `@dauphaihau-camille/api-spec` pinned exactly in
  `package.json`. Never commit the spec itself, only the generated types.
- `packages/shared/src/api/generated/README.md` documents the generator
  commands; keep it in sync when the workflow changes.

### Consuming contract types

Import contract types from `packages/shared/src/api/contracts` and pass them
as the generics of the `apiGet` / `apiPost` / `apiPut` / `apiPatch` /
`apiDelete` helpers instead of hand-written response shapes:

```ts
import type { ApiSchema, operations } from './api/contracts';
```

Domain Zod schemas remain the source of truth for runtime parsing. When a
contract type and the Zod input genuinely differ (nullable or optional
transforms, for example), keep the Zod-inferred type and note the mismatch
instead of forcing the contract type.

### Errors

Every failing API route returns the `ApiErrorResponseDto` envelope:

- `status_code` - HTTP status code; always matches the response status line.
- `code` - stable `UPPER_SNAKE_CASE` machine-readable code. Branch on this,
  not on `message`, and never on internal class names.
- `message` - human-readable summary.
- `request_id` - optional correlation id, also echoed in the `X-Request-Id`
  response header.
- `details` - optional structured context.

Validation failures always return `message: "Validation failed"` with the
per-field reasons in `details.fields` as `{ field, messages: string[] }[]`.
Use `getApiError(error)` from `packages/shared/src/lib/api-error.ts` to read
the envelope from a ky `HTTPError` synchronously, then branch on `code`.
`isApiError` remains available for already-parsed payloads.

### Netlify builds

Netlify runs `bun install` for both sites, which installs the private
`@dauphaihau-camille/api-spec` package. `NODE_AUTH_TOKEN` (a token with
`read:packages` for the `dauphaihau-camille` account) must be set in the
Netlify environment for **both** the app and marketing sites, exactly as CI
provides it. Without it the build fails during install with a registry
`401`/`404`.
