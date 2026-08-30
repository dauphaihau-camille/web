import { z } from 'zod';
import { HTTPError } from 'ky';

import { apiGet, apiPost, apiRequest } from '@shared/lib/api-client';

const aiConversationSessionSchema = z.object({
  id: z.string().min(1),
  workspace_id: z.string().min(1),
  title: z.string().nullable().optional(),
  group: z.enum(['Past week', 'Older']),
  created_at: z.string(),
  updated_at: z.string(),
});

const aiDocumentAttachmentSchema = z.object({
  document_id: z.string().min(1),
  title: z.string(),
});

const aiResponseInlineContentSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  styles: z.object({
    bold: z.literal(true).optional(),
    italic: z.literal(true).optional(),
  }).optional(),
});

const aiResponseBlockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['paragraph', 'bulletListItem', 'numberedListItem', 'heading']),
  content: z.array(aiResponseInlineContentSchema),
  props: z.object({
    level: z.number(),
  }).optional(),
});

const aiChatTurnSchema = z.object({
  id: z.string().min(1),
  session_id: z.string().min(1),
  user_message: z.string(),
  assistant_response: z.string(),
  response_block_payload: z.array(aiResponseBlockSchema),
  status: z.enum(['completed', 'failed', 'canceled']),
  attachments: z.array(aiDocumentAttachmentSchema),
  created_at: z.string(),
  updated_at: z.string(),
});

const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  total_pages: z.number(),
  has_next_page: z.boolean(),
  has_previous_page: z.boolean(),
});

const aiConversationSessionListSchema = z.object({
  items: z.array(aiConversationSessionSchema),
  meta: paginationMetaSchema,
});
const cursorPaginationMetaSchema = z.object({
  limit: z.number(),
  next_cursor: z.string().optional(),
  has_more: z.boolean(),
});

const aiChatTurnListSchema = z.object({
  items: z.array(aiChatTurnSchema),
  meta: cursorPaginationMetaSchema,
});

const aiResponseEntitlementSchema = z.object({
  workspace_id: z.string().min(1),
  plan: z.string().min(1),
  allowance: z.number().nullable(),
  used_responses: z.number(),
  reserved_responses: z.number(),
  remaining_responses: z.number().nullable(),
  limit_reached: z.boolean(),
  upgrade_available: z.boolean(),
});

const aiResponseLimitReachedSchema = z.object({
  code: z.literal('ai_response_limit_reached'),
  message: z.string(),
  remaining_responses: z.number(),
  upgrade_available: z.boolean(),
});

const aiChatTurnStreamEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('started'),
    session_id: z.string().min(1),
  }),
  z.object({
    type: z.literal('block_start'),
    block_id: z.string().min(1),
    block_type: z.enum(['paragraph', 'bulletListItem', 'numberedListItem', 'heading']),
    props: z.object({
      level: z.number(),
    }).optional(),
  }),
  z.object({
    type: z.literal('text_delta'),
    block_id: z.string().min(1),
    content: z.array(aiResponseInlineContentSchema),
  }),
  z.object({
    type: z.literal('block_end'),
    block_id: z.string().min(1),
  }),
  z.object({
    type: z.literal('done'),
    turn: aiChatTurnSchema,
  }),
  z.object({
    type: z.literal('error'),
    message: z.string(),
  }),
]);

export type AiConversationSession = z.infer<typeof aiConversationSessionSchema>;
export type AiChatTurn = z.infer<typeof aiChatTurnSchema>;
export type AiChatTurnPage = z.infer<typeof aiChatTurnListSchema>;
export type AiChatTurnStreamEvent = z.infer<typeof aiChatTurnStreamEventSchema>;
export type AiResponseEntitlement = z.infer<typeof aiResponseEntitlementSchema>;
export type AiResponseLimitReached = z.infer<typeof aiResponseLimitReachedSchema>;


export async function getAiResponseEntitlement(
  workspaceId: string,
): Promise<AiResponseEntitlement> {
  const response = await apiGet<unknown>(`workspaces/${workspaceId}/ai/entitlement`);

  return aiResponseEntitlementSchema.parse(response);
}
export async function listAiConversationSessions(
  workspaceId: string,
  options: { q?: string } = {},
): Promise<AiConversationSession[]> {
  const searchParams = new URLSearchParams();

  if (options.q) {
    searchParams.set('q', options.q);
  }

  const response = await apiGet<unknown>(`workspaces/${workspaceId}/ai/conversations`, {
    searchParams,
  });

  return aiConversationSessionListSchema.parse(response).items;
}

export async function createAiConversationSession(
  workspaceId: string,
): Promise<AiConversationSession> {
  const response = await apiPost<unknown>(`workspaces/${workspaceId}/ai/conversations`);

  return aiConversationSessionSchema.parse(response);
}

export async function listAiChatTurns(
  workspaceId: string,
  sessionId: string,
  options: { cursor?: string; limit?: number } = {},
): Promise<AiChatTurnPage> {
  const searchParams = new URLSearchParams();

  if (options.cursor) {
    searchParams.set('cursor', options.cursor);
  }

  if (options.limit) {
    searchParams.set('limit', String(options.limit));
  }

  const queryString = searchParams.toString();
  const response = await apiGet<unknown>(
    `workspaces/${workspaceId}/ai/conversations/${sessionId}/turns${queryString ? `?${queryString}` : ''}`,
  );

  return aiChatTurnListSchema.parse(response);
}

export async function createAiChatTurn(
  workspaceId: string,
  input: {
    sessionId: string;
    message: string;
    documentIds: string[];
  },
): Promise<AiChatTurn> {
  const response = await apiPost<unknown, {
    message: string;
    document_ids: string[];
  }>(`workspaces/${workspaceId}/ai/conversations/${input.sessionId}/turns`, {
    message: input.message,
    document_ids: input.documentIds,
  });

  return aiChatTurnSchema.parse(response);
}

export async function streamAiChatTurn(
  workspaceId: string,
  input: {
    sessionId: string;
    message: string;
    documentIds: string[];
  },
  onEvent: (event: AiChatTurnStreamEvent) => void,
): Promise<void> {
  const response = await apiRequest(
    `workspaces/${workspaceId}/ai/conversations/${input.sessionId}/turns/stream`,
    {
      json: {
        message: input.message,
        document_ids: input.documentIds,
      },
      method: 'post',
    },
  );

  if (!response.body) {
    throw new Error('AI response stream was empty');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    buffer = parseStreamLines(buffer, onEvent);
  }

  buffer += decoder.decode();
  parseStreamLines(buffer, onEvent, { flush: true });
}

export function getAiResponseLimitReachedData(error: unknown): AiResponseLimitReached | null {
  if (!(error instanceof HTTPError) || error.response.status !== 403) {
    return null;
  }

  const result = aiResponseLimitReachedSchema.safeParse(error.data);

  return result.success ? result.data : null;
}

function parseStreamLines(
  buffer: string,
  onEvent: (event: AiChatTurnStreamEvent) => void,
  options: { flush?: boolean } = {},
): string {
  const lines = buffer.split('\n');
  const remainder = options.flush ? '' : lines.pop() ?? '';

  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }

    onEvent(aiChatTurnStreamEventSchema.parse(JSON.parse(line)));
  }

  return remainder;
}
