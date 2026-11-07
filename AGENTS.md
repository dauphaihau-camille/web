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
