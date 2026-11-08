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

/** The response map of one operation, keyed by HTTP status code. */
type ApiResponses<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { responses: infer Responses } ? Responses : never;

/**
 * The JSON response body of an operation, e.g.
 * `ApiSuccess<'/v1/documents/{documentId}', 'get'>`.
 */
export type ApiSuccess<
  P extends keyof paths,
  M extends keyof paths[P],
  S extends number = 200,
> = ApiResponses<P, M> extends infer Responses
  ? S extends keyof Responses
    ? Responses[S] extends { content: { 'application/json': infer Body } }
      ? Body
      : never
    : never
  : never;

/** The JSON request body of an operation, e.g. `ApiRequestBody<'/v1/documents', 'post'>`. */
export type ApiRequestBody<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { requestBody: { content: { 'application/json': infer Body } } }
  ? Body
  : never;
