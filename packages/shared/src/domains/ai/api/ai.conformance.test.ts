import {
  describe,
  expectTypeOf,
  it,
} from 'vitest';

import type { ApiSchema, paths } from '../../../api/contracts';

type ListAiSessionsResponse =
  paths['/v1/workspaces/{workspaceId}/ai/conversations']['get']['responses'][200]['content']['application/json'];
type CreateAiSessionResponse =
  paths['/v1/workspaces/{workspaceId}/ai/conversations']['post']['responses'][201]['content']['application/json'];
type ListAiTurnsResponse =
  paths['/v1/workspaces/{workspaceId}/ai/conversations/{sessionId}/turns']['get']['responses'][200]['content']['application/json'];
type CreateAiTurnResponse =
  paths['/v1/workspaces/{workspaceId}/ai/conversations/{sessionId}/turns']['post']['responses'][200]['content']['application/json'];
type AiEntitlementResponse =
  paths['/v1/workspaces/{workspaceId}/ai/entitlement']['get']['responses'][200]['content']['application/json'];

describe('ai contract', () => {
  it('ai conversation operations resolve to the session DTOs', () => {
    expectTypeOf<ListAiSessionsResponse>()
      .toEqualTypeOf<ApiSchema<'PaginatedAiConversationSessionResponseDto'>>();
    expectTypeOf<CreateAiSessionResponse>()
      .toEqualTypeOf<ApiSchema<'AiConversationSessionResponseDto'>>();
  });

  it('ai turn operations resolve to the turn DTOs', () => {
    expectTypeOf<ListAiTurnsResponse>()
      .toEqualTypeOf<ApiSchema<'CursorPaginatedAiChatTurnResponseDto'>>();
    expectTypeOf<CreateAiTurnResponse>()
      .toEqualTypeOf<ApiSchema<'AiChatTurnResponseDto'>>();
  });

  it('ai pagination meta matches the contract pagination DTOs', () => {
    expectTypeOf<ApiSchema<'PaginatedAiConversationSessionResponseDto'>['meta']>()
      .toEqualTypeOf<ApiSchema<'AiPaginationMetaResponseDto'>>();
    expectTypeOf<ApiSchema<'CursorPaginatedAiChatTurnResponseDto'>['meta']>()
      .toEqualTypeOf<ApiSchema<'AiCursorPaginationMetaResponseDto'>>();
  });

  it('ai entitlement operation resolves to AiResponseEntitlementResponseDto', () => {
    expectTypeOf<AiEntitlementResponse>()
      .toEqualTypeOf<ApiSchema<'AiResponseEntitlementResponseDto'>>();
    expectTypeOf<ApiSchema<'AiResponseEntitlementResponseDto'>>()
      .toEqualTypeOf<AiEntitlementResponse>();
  });

  it('ai chat turn narrows attachments to the attachment DTO', () => {
    expectTypeOf<ApiSchema<'AiChatTurnResponseDto'>['attachments'][number]>()
      .toEqualTypeOf<ApiSchema<'AiDocumentAttachmentResponseDto'>>();
  });

  it('ai chat turn still declares response_block_payload as string[]', () => {
    // The runtime schema parses the structured BlockNote-style block array the
    // API actually emits, not a list of strings, and the runtime schema module
    // is out of reach for this package (it imports through the app's `@shared`
    // alias). Rather than forcing an assignability assertion that only one
    // side supports, this pins the contract's declared shape so the mismatch
    // surfaces the moment the contract changes.
    expectTypeOf<ApiSchema<'AiChatTurnResponseDto'>['response_block_payload']>()
      .toEqualTypeOf<string[]>();
  });

  it('ai conversation session declares group as a plain string', () => {
    // The runtime schema narrows `group` to 'Past week' | 'Older' and allows a
    // null `title`, so the contract is the wider declaration of the two.
    expectTypeOf<ApiSchema<'AiConversationSessionResponseDto'>['group']>()
      .toEqualTypeOf<string>();
    expectTypeOf<ApiSchema<'AiConversationSessionResponseDto'>['title']>()
      .toEqualTypeOf<string | undefined>();
  });
});
