'use client';

import { useState } from 'react';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/components/ui/popover';
import { cn } from '@shared/lib/utils';
import type { ChatSession } from '../ai-chat-panel.types';

const sessionGroups: ChatSession['group'][] = ['Past week', 'Older'];

type SessionChatSelectProps = {
  isSearching: boolean;
  searchValue: string;
  selectedSessionId: string;
  sessions: ChatSession[];
  onSearchChange: (value: string) => void;
  onSelectSession: (sessionId: string) => void;
};

export function SessionChatSelect({
  isSearching,
  searchValue,
  selectedSessionId,
  sessions,
  onSearchChange,
  onSelectSession,
}: SessionChatSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedSession = sessions.find(
    (session) => session.id === selectedSessionId,
  );
  const selectedSessionTitle = selectedSession?.title ?? 'New AI chat';

  const groupedSessions = sessions;

  function handleSelectSession(sessionId: string) {
    onSelectSession(sessionId);
    onSearchChange('');
    setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={(nextOpen) => {
      setIsOpen(nextOpen);

      if (!nextOpen) {
        onSearchChange('');
      }
    }}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="default"
            aria-label={`Selected chat session: ${selectedSessionTitle}`}
            className="max-w-56 justify-start gap-1.5 rounded-lg bg-muted px-2.5 text-sm font-normal hover:bg-muted/80 aria-expanded:bg-muted"
          />
        }
      >
        <span className="truncate">{selectedSessionTitle}</span>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[min(18rem,calc(100vw-2rem))] gap-2 rounded-xl p-2 shadow-lg"
      >
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => {
              onSearchChange(event.target.value);
            }}
            placeholder="Type to search"
            aria-label="Search chat sessions"
            className="h-8 rounded-lg bg-muted/20 pl-8 text-sm"
          />
        </div>

        <div className="max-h-92 overflow-y-auto pr-1">
          {sessionGroups.map((group) => {
            const groupSessions = groupedSessions.filter((session) => session.group === group);

            if (groupSessions.length === 0) {
              return null;
            }

            return (
              <section key={group} className="space-y-0.5 first:pt-0 not-first:border-t not-first:border-border not-first:pt-2 not-last:pb-2">
                <h3 className="px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {group}
                </h3>
                <div className="">
                  {groupSessions.map((session) => {
                    const isSelected = session.id === selectedSessionId;

                    return (
                      <button
                        key={session.id}
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                          isSelected ? 'bg-muted text-foreground' : 'text-foreground',
                        )}
                        onClick={() => {
                          handleSelectSession(session.id);
                        }}
                      >
                        <span className="truncate">{session.title}</span>
                        {isSelected
                          ? <CheckIcon className="size-3.5 shrink-0" />
                          : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {isSearching
            ? (
              <p className="px-2 py-5 text-center text-xs text-muted-foreground">
                Searching sessions...
              </p>
            )
            : null}

          {!isSearching && groupedSessions.length === 0
            ? (
              <p className="px-2 py-5 text-center text-xs text-muted-foreground">
                {searchValue.trim()
                  ? `No sessions found for “${searchValue.trim()}”.`
                  : 'No sessions found.'}
              </p>
            )
            : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
