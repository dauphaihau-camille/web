import { cn } from '@shared/lib/utils';

import { AiChatComposer } from './ai-chat-composer/ai-chat-composer';
import { emptyChatSuggestions } from './ai-chat-panel.constants';
import { AiChatPanelHeader } from './ai-chat-panel-header';
import { AiChatMessageList } from './ai-chat-message-list/ai-chat-message-list';
import type { AiChatPanelProps } from './ai-chat-panel.types';
import { EmptyChatSuggestions } from './empty-chat-suggestions';
import { useAiChatPanel } from './use-ai-chat-panel';

export function AiChatPanel({
  isOpen,
  panelId,
  workspaceSlug,
  documentBadges,
  onAppendResponse,
  onDocumentBadgeRemove,
  onOpenChangeAction,
}: AiChatPanelProps) {
  const {
    canSubmitMessage,
    draftMessage,
    isBusy,
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

  function closePanel() {
    onOpenChangeAction(false);
  }

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
          'fixed inset-y-0 right-0 z-30 flex h-svh w-[min(100vw,var(--workspace-right-rail-width,30rem))] min-w-0 flex-col border-l border-border bg-background text-foreground shadow-xl transition-transform duration-200 ease-out md:static md:z-auto md:w-[var(--workspace-right-rail-width,30rem)] md:shrink-0 md:shadow-none md:transition-[width,opacity] md:duration-200',
          isOpen
            ? 'translate-x-0 md:opacity-100'
            : 'translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden md:border-l-0 md:opacity-0',
        )}
      >
        <AiChatPanelHeader
          isBusy={isBusy}
          isSearchingSessions={isSearchingSessions}
          searchValue={sessionSearchValue}
          selectedSessionId={selectedSessionId}
          sessions={sessions}
          onClose={closePanel}
          onReset={resetConversation}
          onSearchChange={setSessionSearchValue}
          onSelectSession={selectSession}
        />

        <AiChatMessageList
          isBusy={isBusy}
          messages={messages}
          selectedSessionId={selectedSessionId}
          onAppendResponse={onAppendResponse}
          onLoadOlder={loadOlderTurns}
        />

        {messages.length === 0
          ? (
            <EmptyChatSuggestions
              suggestions={emptyChatSuggestions}
              disabled={isBusy}
              onSelect={selectSuggestion}
            />
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
      </aside>
    </>
  );
}
