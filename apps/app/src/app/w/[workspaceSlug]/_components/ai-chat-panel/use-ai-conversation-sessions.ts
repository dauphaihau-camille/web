'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'ahooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createAiConversationSession,
  listAiConversationSessions,
  type AiConversationSession,
} from './ai-chat-panel.requests';
import type { ChatSession } from './ai-chat-panel.types';

export const localDraftSessionId = 'local-draft';

export function useAiConversationSessions({
  workspaceId,
}: {
  workspaceId?: string;
}) {
  const queryClient = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState(localDraftSessionId);
  const [sessionSearchValue, setSessionSearchValue] = useState('');
  const [sessionById, setSessionById] = useState<Record<string, ChatSession>>({});

  const normalizedSessionSearchValue = useDebounce(sessionSearchValue.trim(), { wait: 300 });

  const sessionsQuery = useQuery({
    queryKey: ['ai-conversations', workspaceId, normalizedSessionSearchValue],
    queryFn: () => listAiConversationSessions(workspaceId ?? '', {
      q: normalizedSessionSearchValue || undefined,
    }),
    enabled: Boolean(workspaceId),
  });

  const sessions = useMemo(
    () => sessionsQuery.data?.map(toChatSession) ?? [],
    [sessionsQuery.data],
  );

  const selectedSession = sessionById[selectedSessionId] ??
    sessions.find((session) => session.id === selectedSessionId) ??
    createSelectedSessionFallback(selectedSessionId);

  const activeSessionSearchValue = sessionSearchValue.trim().toLocaleLowerCase();

  const visibleSessions = activeSessionSearchValue
    ? sessions.filter((session) =>
      session.title.toLocaleLowerCase().includes(activeSessionSearchValue))
    : sessions;

  const displayedSessions = selectedSessionId !== localDraftSessionId
    && !activeSessionSearchValue
    && !visibleSessions.some((session) => session.id === selectedSessionId)
    ? [selectedSession, ...visibleSessions]
    : visibleSessions;

  const createSessionMutation = useMutation({
    mutationFn: (targetWorkspaceId: string) => createAiConversationSession(targetWorkspaceId),
    onSuccess: async (session) => {
      queryClient.setQueryData<AiConversationSession[]>(
        ['ai-conversations', session.workspace_id],
        (currentSessions = []) => [session, ...currentSessions],
      );
      setSelectedSessionId(session.id);
    },
  });

  useEffect(() => {
    if (sessions.length === 0) {
      return;
    }

    setSessionById((currentSessionById) => ({
      ...currentSessionById,
      ...Object.fromEntries(sessions.map((session) => [session.id, session])),
    }));
  }, [sessions]);

  async function createSession() {
    if (!workspaceId) {
      throw new Error('Workspace is not loaded');
    }
    return toChatSession(await createSessionMutation.mutateAsync(workspaceId));
  }

  return {
    createSession,
    isCreatingSession: createSessionMutation.isPending,
    isLoadingSessions: sessionsQuery.isLoading,
    isSearchingSessions: sessionsQuery.isFetching && normalizedSessionSearchValue.length > 0,
    resetToDraftSession: () => setSelectedSessionId(localDraftSessionId),
    selectedSession,
    selectSession: setSelectedSessionId,
    sessionSearchValue,
    sessions: displayedSessions,
    setSessionSearchValue,
  };
}


function toChatSession(session: AiConversationSession): ChatSession {
  return {
    id: session.id,
    title: session.title ?? 'Untitled',
    group: session.group,
    messages: [],
  };
}

function createSelectedSessionFallback(sessionId: string): ChatSession {
  return {
    id: sessionId,
    title: sessionId === localDraftSessionId ? 'New AI chat' : 'Untitled',
    group: 'Past week',
    messages: [],
  };
}