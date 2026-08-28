'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  listAiChatTurns,
  type AiChatTurn,
  type AiChatTurnPage,
} from './ai-chat-panel.requests';
import type { ChatMessage } from './ai-chat-panel.types';
import { localDraftSessionId } from './use-ai-conversation-sessions';

export function useAiConversationMessages({
  selectedSessionId,
  workspaceId,
}: {
  selectedSessionId: string;
  workspaceId?: string;
}) {
  const [messagesBySessionId, setMessagesBySessionId] = useState<Record<string, ChatMessage[]>>({
    [localDraftSessionId]: [],
  });
  const [turnPageBySessionId, setTurnPageBySessionId] = useState<Record<string, AiChatTurnPage['meta']>>({});
  const [loadingOlderSessionId, setLoadingOlderSessionId] = useState<string | null>(null);

  const turnsQuery = useQuery({
    queryKey: ['ai-conversations', workspaceId, selectedSessionId, 'turns'],
    queryFn: () => listAiChatTurns(workspaceId ?? '', selectedSessionId),
    enabled: Boolean(workspaceId)
      && selectedSessionId !== localDraftSessionId
      && messagesBySessionId[selectedSessionId] === undefined,
  });

  const selectedMessages = messagesBySessionId[selectedSessionId] ?? [];

  useEffect(() => {
    if (!turnsQuery.data || selectedSessionId === localDraftSessionId) {
      return;
    }

    setSessionMessages(selectedSessionId, createMessagesFromTurns(turnsQuery.data.items));
    setTurnPageBySessionId((currentPagesBySessionId) => ({
      ...currentPagesBySessionId,
      [selectedSessionId]: turnsQuery.data.meta,
    }));
  }, [selectedSessionId, turnsQuery.data]);

  function setSessionMessages(sessionId: string, nextMessages: ChatMessage[]) {
    setMessagesBySessionId((currentMessagesBySessionId) => ({
      ...currentMessagesBySessionId,
      [sessionId]: nextMessages,
    }));
  }

  function appendSessionMessage(sessionId: string, message: ChatMessage) {
    setMessagesBySessionId((currentMessagesBySessionId) => ({
      ...currentMessagesBySessionId,
      [sessionId]: [
        ...(currentMessagesBySessionId[sessionId] ?? []),
        message,
      ],
    }));
  }

  function prependSessionMessages(sessionId: string, olderMessages: ChatMessage[]) {
    setMessagesBySessionId((currentMessagesBySessionId) => ({
      ...currentMessagesBySessionId,
      [sessionId]: [
        ...olderMessages,
        ...(currentMessagesBySessionId[sessionId] ?? []),
      ],
    }));
  }

  function appendAssistantDelta(sessionId: string, text: string) {
    setMessagesBySessionId((currentMessagesBySessionId) => {
      const existingMessages = currentMessagesBySessionId[sessionId] ?? [];
      const pendingMessageId = createPendingAssistantMessage(sessionId).id;
      const pendingMessageIndex = existingMessages.findIndex((existingMessage) => existingMessage.id === pendingMessageId);

      if (pendingMessageIndex === -1) {
        return {
          ...currentMessagesBySessionId,
          [sessionId]: [
            ...existingMessages,
            {
              ...createPendingAssistantMessage(sessionId),
              content: text,
            },
          ],
        };
      }

      return {
        ...currentMessagesBySessionId,
        [sessionId]: existingMessages.map((existingMessage, index) => index === pendingMessageIndex
          ? { ...existingMessage, content: `${existingMessage.content}${text}` }
          : existingMessage),
      };
    });
  }

  function completeAssistantMessage(sessionId: string, turn: AiChatTurn) {
    setMessagesBySessionId((currentMessagesBySessionId) => {
      const existingMessages = currentMessagesBySessionId[sessionId] ?? [];
      const pendingMessageId = createPendingAssistantMessage(sessionId).id;

      const finalMessage = createAssistantMessage(
        sessionId,
        turn.id,
        turn.assistant_response,
      );

      if (!existingMessages.some((existingMessage) => existingMessage.id === pendingMessageId)) {
        return {
          ...currentMessagesBySessionId,
          [sessionId]: [
            ...existingMessages,
            finalMessage,
          ],
        };
      }

      return {
        ...currentMessagesBySessionId,
        [sessionId]: existingMessages.map((existingMessage) => existingMessage.id === pendingMessageId
          ? finalMessage
          : existingMessage),
      };
    });
  }

  async function loadOlderTurns() {
    const turnPage = turnPageBySessionId[selectedSessionId];

    if (
      !workspaceId
      || selectedSessionId === localDraftSessionId
      || !turnPage?.has_more
      || !turnPage.next_cursor
      || loadingOlderSessionId === selectedSessionId
    ) {
      return;
    }

    try {
      setLoadingOlderSessionId(selectedSessionId);
      const olderTurnPage = await listAiChatTurns(workspaceId, selectedSessionId, {
        cursor: turnPage.next_cursor,
        limit: turnPage.limit,
      });

      prependSessionMessages(selectedSessionId, createMessagesFromTurns(olderTurnPage.items));
      setTurnPageBySessionId((currentPagesBySessionId) => ({
        ...currentPagesBySessionId,
        [selectedSessionId]: olderTurnPage.meta,
      }));
    }
    catch {
      toast('Could not load older AI messages');
    }
    finally {
      setLoadingOlderSessionId(null);
    }
  }

  return {
    appendAssistantDelta,
    appendSessionMessage,
    completeAssistantMessage,
    isLoadingTurns: turnsQuery.isLoading,
    loadOlderTurns,
    messages: selectedMessages,
    setSessionMessages,
  };
}


function createAssistantMessage(sessionId: string, turnId: string, content: string): ChatMessage {
  return {
    id: `assistant-${sessionId}-${turnId}`,
    role: 'assistant',
    content,
  };
}

function createUserMessageFromTurn(turn: AiChatTurn): ChatMessage {
  return {
    id: `user-${turn.session_id}-${turn.id}`,
    role: 'user',
    content: turn.user_message,
  };
}

function createMessagesFromTurns(turns: AiChatTurn[]): ChatMessage[] {
  return turns.flatMap((turn) => [
    createUserMessageFromTurn(turn),
    createAssistantMessage(turn.session_id, turn.id, turn.assistant_response),
  ]);
}

function createPendingAssistantMessage(sessionId: string): ChatMessage {
  return {
    id: `assistant-${sessionId}-pending`,
    role: 'assistant',
    content: '',
  };
}
