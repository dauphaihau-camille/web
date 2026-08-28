import {
  MessageCirclePlusIcon,
  PanelRightCloseIcon,
} from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';

import { SessionChatSelect } from './session-chat-select';
import type { ChatSession } from '../ai-chat-panel.types';

type AiChatPanelHeaderProps = {
  isBusy: boolean;
  isSearchingSessions: boolean;
  searchValue: string;
  selectedSessionId: string;
  sessions: ChatSession[];
  onClose: () => void;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onSelectSession: (sessionId: string) => void;
};

export function AiChatPanelHeader({
  isBusy,
  isSearchingSessions,
  searchValue,
  selectedSessionId,
  sessions,
  onClose,
  onReset,
  onSearchChange,
  onSelectSession,
}: AiChatPanelHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4">
      <SessionChatSelect
        isSearching={isSearchingSessions}
        searchValue={searchValue}
        selectedSessionId={selectedSessionId}
        sessions={sessions}
        onSearchChange={onSearchChange}
        onSelectSession={onSelectSession}
      />

      <div className="flex gap-1">
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={(
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Start new chat"
                disabled={isBusy}
                onClick={onReset}
              >
                <MessageCirclePlusIcon className="size-4" />
              </Button>
            )}
          />
          <TooltipContent>Start new chat</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={(
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close AI chat"
                onClick={onClose}
              >
                <PanelRightCloseIcon className="size-4" />
              </Button>
            )}
          />
          <TooltipContent>Hide chat</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
