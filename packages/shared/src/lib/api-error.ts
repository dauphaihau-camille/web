import type { ApiSchema } from '../api/contracts';

/**
 * The error envelope every API route returns: `status_code`, `code`,
 * `message`, optional `request_id`, and optional structured `details`.
 */
export type ApiError = ApiSchema<'ApiErrorResponseDto'>;

/** One validation failure entry from `details.fields`. */
export type ApiErrorField = {
  field: string;
  messages: string[];
};

function isApiErrorField(value: unknown): value is ApiErrorField {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as { field?: unknown; messages?: unknown };

  return typeof candidate.field === 'string'
    && Array.isArray(candidate.messages)
    && candidate.messages.every((message: unknown) => typeof message === 'string');
}

function isApiErrorFieldList(value: unknown): value is ApiErrorField[] {
  return Array.isArray(value) && value.every(isApiErrorField);
}

/**
 * Structural guard for the API error envelope, for use on thrown `ky`
 * `HTTPError` payloads. `request_id` and `details` are optional.
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
 * Validation field errors from `details.fields`, or `[]` when the error carries
 * no field errors or they are malformed.
 */
export function getApiErrorFields(error: ApiError): ApiErrorField[] {
  const fields: unknown = error.details?.fields;

  return isApiErrorFieldList(fields) ? fields : [];
}
