/**
 * Entry point for the generated OpenAPI contract types.
 *
 * `./generated/openapi` is produced by `bun run generate:api-types` from the
 * published `@dauphaihau-camille/api-spec` package; never edit it by hand.
 * Import contract types from here so the generated file stays an
 * implementation detail behind a stable, reviewable surface.
 */
import type {
  components,
  operations,
  paths,
  webhooks,
} from './generated/openapi';

export type {
  components,
  operations,
  paths,
  webhooks,
};

/** A component schema from the contract, e.g. `ApiSchema<'PublicDocumentResponseDto'>`. */
export type ApiSchema<Name extends keyof components['schemas']> =
  components['schemas'][Name];
