'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getWorkspace, workspaceKeys } from '@/domains/workspace';
import {
  getAiResponseEntitlement,
  getAiResponseLimitReachedData,
  streamAiChatTurn,
} from './ai-chat-panel.requests';
import type {
  AiChatDocumentBadge,
  ChatMessage,
  ChatSuggestion,
} from './ai-chat-panel.types';
import { localDraftSessionId, useAiConversationSessions } from './use-ai-conversation-sessions';
import { useAiConversationMessages } from './use-ai-conversation-messages';

export function useAiChatPanel({
  documentBadges,
  workspaceSlug,
}: {
  documentBadges: AiChatDocumentBadge[];
  workspaceSlug: string;
}) {
  const queryClient = useQueryClient();
  const [draftMessage, setDraftMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasReachedAiLimit, setHasReachedAiLimit] = useState(false);

  const workspaceQuery = useQuery({
    queryKey: workspaceKeys.detail(workspaceSlug),
    queryFn: () => getWorkspace(workspaceSlug),
  });

  const workspaceId = workspaceQuery.data?.id;

  const conversationSessions = useAiConversationSessions({ workspaceId });

  const aiEntitlementQuery = useQuery({
    queryKey: ['ai-entitlement', workspaceId],
    queryFn: () => getAiResponseEntitlement(workspaceId ?? ''),
    enabled: Boolean(workspaceId),
  });

  const conversationMessages = useAiConversationMessages({
    selectedSessionId: conversationSessions.selectedSession.id,
    workspaceId,
  });

  const isWorkspaceAiLimitReached = hasReachedAiLimit
    || aiEntitlementQuery.data?.limit_reached === true;

  const isBusy = workspaceQuery.isLoading
    || aiEntitlementQuery.isLoading
    || conversationSessions.isLoadingSessions
    || conversationSessions.isCreatingSession
    || conversationMessages.isLoadingTurns
    || isStreaming;

  const canSubmitMessage = !isBusy
    && !isWorkspaceAiLimitReached
    && draftMessage.trim().length > 0;

  async function ensureSession() {
    if (conversationSessions.selectedSession.id !== localDraftSessionId) {
      return conversationSessions.selectedSession;
    }

    const session = await conversationSessions.createSession();
    conversationMessages.setSessionMessages(session.id, []);

    return session;
  }

  async function sendMessage(content: string) {
    if (isBusy || isWorkspaceAiLimitReached || content.trim().length === 0) {
      return;
    }

    try {
      const session = await ensureSession();
      const userMessage = createUserMessage(content.trim());

      conversationMessages.appendSessionMessage(session.id, userMessage);
      setIsStreaming(true);

      await streamAiChatTurn(workspaceId ?? '', {
        sessionId: session.id,
        message: content.trim(),
        documentIds: documentBadges.map((documentBadge) => documentBadge.id),
      }, (event) => {
        if (event.type === 'delta') {
          conversationMessages.appendAssistantDelta(session.id, event.text);
          return;
        }

        if (event.type === 'done') {
          conversationMessages.completeAssistantMessage(session.id, event.turn);

          void queryClient.invalidateQueries({
            queryKey: ['ai-conversations', workspaceId],
          });
          void queryClient.invalidateQueries({
            queryKey: ['ai-entitlement', workspaceId],
          });
          return;
        }

        if (event.type === 'error') {
          toast(event.message);
        }
      });
    }
    catch (error) {
      const aiLimitError = getAiResponseLimitReachedData(error);

      if (aiLimitError) {
        setHasReachedAiLimit(true);
        toast(aiLimitError.message);
        return;
      }

      if (error instanceof Error && error.message === 'Workspace is not loaded') {
        toast('Workspace is still loading');
        return;
      }

      toast('Could not get AI response');
    }
    finally {
      setIsStreaming(false);
    }
  }

  function resetConversation() {
    if (isBusy) {
      return;
    }
    conversationSessions.resetToDraftSession();
    setDraftMessage('');
    conversationMessages.setSessionMessages(localDraftSessionId, []);
  }

  function submitDraftMessage() {
    if (!canSubmitMessage) {
      return;
    }
    const message = draftMessage;
    setDraftMessage('');
    void sendMessage(message);
  }

  function selectSession(sessionId: string) {
    if (isBusy) {
      return;
    }
    conversationSessions.selectSession(sessionId);
  }

  function selectSuggestion(suggestion: ChatSuggestion) {
    void sendMessage(suggestion.messageContent);
  }

  return {
    canSubmitMessage,
    isWorkspaceAiLimitReached,
    draftMessage,
    isBusy,
    isSearchingSessions: conversationSessions.isSearchingSessions,
    messages: conversationMessages.messages,
    loadOlderTurns: conversationMessages.loadOlderTurns,
    resetConversation,
    selectedSessionId: conversationSessions.selectedSession.id,
    selectSession,
    selectSuggestion,
    sessionSearchValue: conversationSessions.sessionSearchValue,
    sessions: conversationSessions.sessions,
    setDraftMessage,
    setSessionSearchValue: conversationSessions.setSessionSearchValue,
    submitDraftMessage,
  };
}


function createUserMessage(content: string): ChatMessage {
  return {
    id: `user-${crypto.randomUUID()}`,
    role: 'user',
    content,
  };
}