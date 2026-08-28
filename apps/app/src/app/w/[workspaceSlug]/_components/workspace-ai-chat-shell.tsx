'use client';

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { BotIcon, XIcon } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';

import { AiChatPanel } from './ai-chat-panel/ai-chat-panel';
import type { AiChatAppendResponse, AiChatDocumentBadge } from './ai-chat-panel/ai-chat-panel.types';

const rightRailWidth = '30rem';
const closedRightRailReservedWidth = '0rem';

type WorkspaceAiChatCurrentDocument = AiChatDocumentBadge & {
  onAppendResponse?: AiChatAppendResponse;
};

type WorkspaceAiChatAppendTarget = {
  documentId: string;
  appendResponse: AiChatAppendResponse;
};

type WorkspaceAiChatDocumentContextValue = {
  registerCurrentDocument: (document: WorkspaceAiChatCurrentDocument) => () => void;
};

const WorkspaceAiChatDocumentContext =
  createContext<WorkspaceAiChatDocumentContextValue | null>(null);

export function useWorkspaceAiChatDocument() {
  return useContext(WorkspaceAiChatDocumentContext);
}

type WorkspaceAiChatShellProps = {
  children: ReactNode;
  workspaceSlug: string;
};

export function WorkspaceAiChatShell({
  children,
  workspaceSlug,
}: WorkspaceAiChatShellProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [documentBadges, setDocumentBadges] = useState<AiChatDocumentBadge[]>([]);
  const [appendTarget, setAppendTarget] = useState<WorkspaceAiChatAppendTarget | null>(null);
  const [removedDocumentIds, setRemovedDocumentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const panelId = useId();

  const registerCurrentDocument = useCallback((document: WorkspaceAiChatCurrentDocument) => {
    setAppendTarget(document.onAppendResponse
      ? { documentId: document.id, appendResponse: document.onAppendResponse }
      : null);
    setDocumentBadges((currentBadges) => {
      if (removedDocumentIds.has(document.id)) {
        return currentBadges.filter((badge) => badge.id !== document.id);
      }

      return [{ id: document.id, title: document.title }];
    });

    return () => {
      setAppendTarget((currentTarget) =>
        currentTarget?.documentId === document.id ? null : currentTarget,
      );
      setDocumentBadges((currentBadges) =>
        currentBadges.filter((badge) => badge.id !== document.id),
      );
    };
  }, [removedDocumentIds]);

  function removeDocumentBadge(documentId: string) {
    setRemovedDocumentIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(documentId);
      return nextIds;
    });
    setDocumentBadges((currentBadges) =>
      currentBadges.filter((badge) => badge.id !== documentId),
    );
  }

  const aiChatDocument = useMemo(
    () => ({ registerCurrentDocument }),
    [registerCurrentDocument],
  );

  return (
    <WorkspaceAiChatDocumentContext.Provider value={aiChatDocument}>
      <div
        className="relative flex min-h-0 min-w-0 flex-1 items-stretch overflow-hidden"
        style={{
          '--workspace-right-rail-width': rightRailWidth,
          '--workspace-right-rail-reserved-width': isChatOpen
            ? 'var(--workspace-right-rail-width)'
            : closedRightRailReservedWidth,
        } as CSSProperties}
      >
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={(
              <Button
                type="button"
                size="icon-xl"
                variant="outline"
                aria-label={isChatOpen ? 'Close AI chat' : 'Open AI chat'}
                aria-expanded={isChatOpen}
                aria-controls={panelId}
                className="absolute right-6 bottom-6 z-40 rounded-full shadow-lg transition-[right] md:right-[calc(1.5rem+var(--workspace-right-rail-reserved-width,0rem))] md:bottom-6"
                onClick={() => setIsChatOpen((currentOpen) => !currentOpen)}
              >
                {isChatOpen ? <XIcon className="size-5" /> : <BotIcon className="size-5" />}
              </Button>
            )}
          />
          <TooltipContent>
            {isChatOpen ? 'Close AI chat' : 'Open AI chat'}
          </TooltipContent>
        </Tooltip>

        {children}

        {isChatOpen
          ? (
            <AiChatPanel
              panelId={panelId}
              isOpen={isChatOpen}
              workspaceSlug={workspaceSlug}
              documentBadges={documentBadges}
              onDocumentBadgeRemove={removeDocumentBadge}
              onAppendResponse={appendTarget?.appendResponse}
              onOpenChangeAction={setIsChatOpen}
            />
          )
          : null}
      </div>
    </WorkspaceAiChatDocumentContext.Provider>
  );
}
