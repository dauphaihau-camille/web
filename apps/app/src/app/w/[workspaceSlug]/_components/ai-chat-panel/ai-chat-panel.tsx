'use client';

import {
  type CSSProperties, useEffect, useRef, useState, 
} from 'react';

import { cn } from '@shared/lib/utils';

import { AiChatLimitCard } from './ai-chat-limit-card';
import { AiChatComposer } from './ai-chat-composer/ai-chat-composer';
import { emptyChatSuggestions } from './ai-chat-panel.constants';
import { AiChatPanelHeader } from './ai-chat-panel-header';
import { AiChatMessageList } from './ai-chat-message-list/ai-chat-message-list';
import type { AiChatPanelProps } from './ai-chat-panel.types';
import { EmptyChatSuggestions } from './empty-chat-suggestions';
import { useAiChatPanel } from './use-ai-chat-panel/use-ai-chat-panel';

export function AiChatPanel({
  isOpen,
  panelId,
  workspaceSlug,
  documentBadges,
  onAppendResponse,
  onDocumentBadgeRemove,
  onDocumentBadgesRestore,
  onOpenChangeAction,
}: AiChatPanelProps) {
  const composerDockRef = useRef<HTMLDivElement>(null);
  const [composerDockHeight, setComposerDockHeight] = useState(0);
  const {
    canSubmitMessage,
    draftMessage,
    isBusy,
    isWorkspaceAiLimitReached,
    isSearchingSessions,
    messages,
    loadOlderTurns,
    resetConversation,
    selectedSessionId,
    selectSession,
    selectSuggestion,
    sessionSearchValue,
    sessions,
    setDraftMessage,
    setSessionSearchValue,
    submitDraftMessage,
  } = useAiChatPanel({
    documentBadges,
    workspaceSlug,
  });

  function startNewChat() {
    resetConversation();
    onDocumentBadgesRestore();
  }

  function closePanel() {
    onOpenChangeAction(false);
  }

  useEffect(() => {
    const composerDock = composerDockRef.current;

    if (!composerDock) {
      return;
    }

    const syncComposerDockHeight = () => {
      setComposerDockHeight(composerDock.getBoundingClientRect().height);
    };

    syncComposerDockHeight();

    const resizeObserver = new ResizeObserver(syncComposerDockHeight);
    resizeObserver.observe(composerDock);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <>
      <div
        aria-hidden={!isOpen}
        className={cn(
          'fixed inset-0 z-30 bg-background/60 backdrop-blur-xs transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closePanel}
      />

      <aside
        id={panelId}
        aria-label="AI chat"
        data-slot="ai-chat-panel"
        data-state={isOpen ? 'open' : 'closed'}
        className={cn(
          'fixed inset-y-0 right-0 z-30 flex h-svh w-[min(100vw,var(--workspace-right-rail-width,30rem))] min-w-0 flex-col border-l border-border bg-surface text-foreground shadow-xl transition-transform duration-200 ease-out md:relative md:z-auto md:w-[var(--workspace-right-rail-width,30rem)] md:shrink-0 md:shadow-none md:transition-[width,opacity] md:duration-200 pb-4',
          isOpen
            ? 'translate-x-0 md:opacity-100'
            : 'translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden md:border-l-0 md:opacity-0',
        )}
        style={{
          '--ai-chat-composer-dock-height': `${composerDockHeight}px`,
        } as CSSProperties}
      >
        <AiChatPanelHeader
          isBusy={isBusy}
          isSearchingSessions={isSearchingSessions}
          searchValue={sessionSearchValue}
          selectedSessionId={selectedSessionId}
          sessions={sessions}
          onClose={closePanel}
          onReset={startNewChat}
          onSearchChange={setSessionSearchValue}
          onSelectSession={selectSession}
        />

        <AiChatMessageList
          canAppendResponse={documentBadges.length > 0}
          isBusy={isBusy}
          messages={messages}
          selectedSessionId={selectedSessionId}
          onAppendResponse={onAppendResponse}
          onLoadOlder={loadOlderTurns}
        />

        <div
          ref={composerDockRef}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 space-y-3 bg-transparent py-3 px-4"
        >
          {messages.length === 0
            ? (
              <div className="pointer-events-auto">
                <EmptyChatSuggestions
                  suggestions={emptyChatSuggestions}
                  disabled={isBusy}
                  onSelect={selectSuggestion}
                />
              </div>
            )
            : null}

          {isWorkspaceAiLimitReached
            ? (
              <div className="pointer-events-auto">
                <AiChatLimitCard />
              </div>
            )
            : null}

          <AiChatComposer
            canSubmit={canSubmitMessage}
            draftMessage={draftMessage}
            isBusy={isBusy}
            documentBadges={documentBadges}
            onDocumentBadgeRemove={onDocumentBadgeRemove}
            onDraftMessageChange={setDraftMessage}
            onSubmit={submitDraftMessage}
          />
        </div>
      </aside>
    </>
  );
}
