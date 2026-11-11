import type { paths } from './contracts';

/**
 * Operations covered by a response conformance assertion.
 *
 * `used-operations.test.ts` walks every `ApiSuccess<…>` call site in the web
 * tree and fails when this list misses one, so adding a new API call forces a
 * matching contract assertion. Every entry is type-checked against the
 * generated contract: a renamed path or a verb the contract does not declare
 * breaks `bun run typecheck`.
 *
 * The publish entries live in `contracts.test.ts`; the remaining domains use
 * their `*.conformance.test.ts`.
 */

type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'options'
  | 'head'
  | 'trace';

/** Verbs the generator actually populated for a path (unused verbs are `never`). */
type OperationMethod<P extends keyof paths> = {
  [M in HttpMethod]: M extends keyof paths[P]
    ? paths[P][M] extends { responses: unknown }
      ? M
      : never
    : never;
}[HttpMethod];

/** A `{ path, method }` pair the contract declares as a real operation. */
export type AssertedOperation = {
  [P in keyof paths]: [OperationMethod<P>] extends [never]
    ? never
    : { path: P; method: OperationMethod<P> };
}[keyof paths];

/** Stable lookup key shared by the registry and the used-operation scan. */
export function operationKey(path: string, method: string): string {
  return `${method.toUpperCase()} ${path}`;
}

export const ASSERTED_OPERATIONS: readonly AssertedOperation[] = [
  // ai
  { path: '/v1/workspaces/{workspaceId}/ai/entitlement', method: 'get' },
  { path: '/v1/workspaces/{workspaceId}/ai/conversations', method: 'get' },
  { path: '/v1/workspaces/{workspaceId}/ai/conversations', method: 'post' },
  { path: '/v1/workspaces/{workspaceId}/ai/conversations/{sessionId}/turns', method: 'get' },
  { path: '/v1/workspaces/{workspaceId}/ai/conversations/{sessionId}/turns', method: 'post' },

  // auth
  { path: '/v1/auth/email/start', method: 'post' },
  { path: '/v1/auth/email/verify', method: 'post' },
  { path: '/v1/auth/login', method: 'post' },
  { path: '/v1/auth/logout', method: 'post' },
  { path: '/v1/auth/refresh', method: 'post' },
  { path: '/v1/auth/register', method: 'post' },
  { path: '/v1/auth/reset-password', method: 'post' },

  // document
  { path: '/v1/documents', method: 'post' },
  { path: '/v1/documents/{documentId}', method: 'get' },
  { path: '/v1/documents/{documentId}', method: 'patch' },
  { path: '/v1/documents/{documentId}', method: 'delete' },
  { path: '/v1/documents/{documentId}/access-settings', method: 'get' },
  { path: '/v1/documents/{documentId}/access-settings', method: 'patch' },
  { path: '/v1/documents/{documentId}/archive', method: 'post' },
  { path: '/v1/documents/{documentId}/children', method: 'get' },
  { path: '/v1/documents/{documentId}/collaborators', method: 'get' },
  { path: '/v1/documents/{documentId}/collaborators/{userId}', method: 'delete' },
  { path: '/v1/documents/{documentId}/commands/archive-subdoc', method: 'post' },
  { path: '/v1/documents/{documentId}/commands/create-subdoc', method: 'post' },
  { path: '/v1/documents/{documentId}/duplicate', method: 'post' },
  { path: '/v1/documents/{documentId}/invitations', method: 'get' },
  { path: '/v1/documents/{documentId}/invitations/{invitationId}', method: 'patch' },
  { path: '/v1/documents/{documentId}/invitations/{invitationId}', method: 'delete' },
  { path: '/v1/documents/{documentId}/move', method: 'post' },
  { path: '/v1/documents/{documentId}/restore', method: 'post' },
  { path: '/v1/documents/{documentId}/share', method: 'post' },
  { path: '/v1/documents/{documentId}/shares', method: 'post' },
  { path: '/v1/workspaces/{workspaceId}/documents', method: 'get' },
  { path: '/v1/workspaces/{workspaceId}/documents/archived', method: 'get' },

  // favorite
  { path: '/v1/documents/{documentId}/favorite', method: 'get' },
  { path: '/v1/documents/{documentId}/favorite', method: 'post' },
  { path: '/v1/documents/{documentId}/favorite', method: 'delete' },
  { path: '/v1/workspaces/{workspaceId}/favorites', method: 'get' },

  // publish
  { path: '/v1/documents/{documentId}/publish', method: 'get' },
  { path: '/v1/documents/{documentId}/publish', method: 'post' },
  { path: '/v1/documents/{documentId}/publish', method: 'delete' },
  { path: '/v1/published/{publishedDocumentId}', method: 'get' },

  // search
  { path: '/v1/workspaces/{workspaceId}/search/documents', method: 'get' },

  // subscription
  { path: '/v1/workspaces/{workspaceId}/subscription', method: 'get' },
  { path: '/v1/workspaces/{workspaceId}/subscription/cancel', method: 'post' },
  { path: '/v1/workspaces/{workspaceId}/subscription/checkout', method: 'post' },

  // teamspace
  { path: '/v1/teamspaces/{teamspaceId}', method: 'patch' },
  { path: '/v1/workspaces/{workspaceId}/teamspaces', method: 'get' },
  { path: '/v1/workspaces/{workspaceId}/teamspaces', method: 'post' },

  // workspace
  { path: '/v1/me/workspaces', method: 'get' },
  { path: '/v1/me/workspaces/last-active', method: 'get' },
  { path: '/v1/workspaces', method: 'post' },
  { path: '/v1/workspaces/{workspaceId}', method: 'get' },
  { path: '/v1/workspaces/{workspaceId}', method: 'patch' },
  { path: '/v1/workspaces/{workspaceId}', method: 'delete' },
  { path: '/v1/workspaces/{workspaceId}/members', method: 'get' },
  { path: '/v1/workspaces/{workspaceId}/members', method: 'post' },
  { path: '/v1/workspaces/{workspaceId}/members/search', method: 'get' },
  { path: '/v1/workspaces/{workspaceId}/members/{memberId}', method: 'patch' },
  { path: '/v1/workspaces/{workspaceId}/members/{memberId}', method: 'delete' },

  // workspace-preference
  { path: '/v1/workspaces/{workspaceId}/preferences', method: 'get' },
  { path: '/v1/workspaces/{workspaceId}/preferences', method: 'patch' },
];
