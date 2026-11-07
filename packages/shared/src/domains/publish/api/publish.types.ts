import type { ApiSchema } from '../../../api/contracts';

/**
 * Publish types are the published contract's component schemas. The zod
 * schemas in `publish.schemas.ts` parse the same payloads at runtime; the
 * conformance test in `packages/shared/src/api/contracts.test.ts` asserts both
 * sides stay identical.
 */
export type PublishStatus = ApiSchema<'PublishedDocumentResponseDto'>;
export type PublicDocument = ApiSchema<'PublicDocumentResponseDto'>;
