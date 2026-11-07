# Generated API Types

`openapi.d.ts` is generated from the published `@dauphaihau-camille/api-spec`
OpenAPI contract. It is committed so typechecking and builds never need the
contract package, and CI re-runs the generator to catch drift.

**Never edit `openapi.d.ts` by hand.** Regenerate it:

```bash
# From the directories above (`apps/web`), using the installed contract package
bun run generate:api-types

# or point at a local spec file while the package is not published yet
API_SPEC_PATH=../api/api/openapi.json bun run generate:api-types
bun run generate:api-types -- --spec ../api/api/openapi.json

# verify the committed artifact is current (what CI runs)
bun run generate:api-types -- --check
```

Spec resolution order:

1. `--spec <path>`
2. `API_SPEC_PATH`
3. `node_modules/@dauphaihau-camille/api-spec/openapi.json`

Installing the contract package needs a `NODE_AUTH_TOKEN` with `read:packages`
access for the `dauphaihau-camille` account (see [`.npmrc`](../../../../../.npmrc)).
