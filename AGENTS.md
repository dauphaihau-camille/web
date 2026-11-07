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

- Regenerate after `@dauphaihau-camille/api-spec` changes; do not hand-fix
  types. The spec resolves from `--spec <path>`, then `API_SPEC_PATH`, then
  `node_modules/@dauphaihau-camille/api-spec/openapi.json`. Before the package
  is published, bootstrap with
  `API_SPEC_PATH=../api/api/openapi.json bun run generate:api-types`.
- Installing the package needs `NODE_AUTH_TOKEN` with `read:packages` for the
  `dauphaihau-camille` account (see `.npmrc`). A registry `404` means the token
  cannot see the package, not that the package is missing.
- The `contract` CI job runs `bun run generate:api-types -- --check` against the
  committed artifact once `@dauphaihau-camille/api-spec` is pinned in
  `package.json`. Until the first publication it skips with a notice; the
  superproject verifies the committed types against `apps/api/api/openapi.json`
  in that window. Never commit the spec itself, only the generated types.
- `packages/shared/src/api/generated/README.md` documents the generator
  commands; keep it in sync when the workflow changes.
