import { HTTPError } from 'ky';

import type { ApiSchema } from '../api/contracts';

/**
 * The error envelope every API route returns: `status_code`, `code`,
 * `message`, optional `request_id`, and optional structured `details`.
 */
export type ApiError = ApiSchema<'ApiErrorResponseDto'>;

/**
 * Structural guard for the API error envelope. `request_id` and `details` are
 * optional; `details.fields` is not validated here.
 */
export function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ApiError>;
  const details = candidate.details;

  return typeof candidate.status_code === 'number'
    && typeof candidate.code === 'string'
    && typeof candidate.message === 'string'
    && (candidate.request_id === undefined || typeof candidate.request_id === 'string')
    && (details === undefined || (typeof details === 'object' && details !== null && !Array.isArray(details)));
}

/**
 * Returns the API error envelope carried by a thrown `ky` `HTTPError`.
 *
 * `HTTPError.data` holds the pre-parsed response body, so this is synchronous;
 * use the error `code` for branching and fall back to the HTTP status only
 * when the body is not an envelope (proxy errors, non-JSON responses).
 */
export function getApiError(error: unknown): ApiError | undefined {
  if (error instanceof HTTPError && isApiError(error.data)) {
    return error.data;
  }

  return undefined;
}
