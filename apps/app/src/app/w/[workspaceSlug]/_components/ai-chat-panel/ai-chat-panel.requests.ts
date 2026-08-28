import { z } from 'zod';

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

const aiChatTurnSchema = z.object({
  id: z.string().min(1),
  session_id: z.string().min(1),
  user_message: z.string(),
  assistant_response: z.string(),
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

const aiChatTurnStreamEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('started'),
    session_id: z.string().min(1),
  }),
  z.object({
    type: z.literal('delta'),
    text: z.string(),
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
