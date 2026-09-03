import {
  ArrowUpIcon,
  FileIcon,
  FileTextIcon,
  XIcon,
} from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@shared/components/ui/input-group';
import { Badge } from '@shared/components/ui/badge';

import type { AiChatDocumentBadge } from '../ai-chat-panel.types';

type AiChatComposerProps = {
  canSubmit: boolean;
  draftMessage: string;
  isBusy: boolean;
  documentBadges: AiChatDocumentBadge[];
  onDocumentBadgeRemove: (documentId: string) => void;
  onDraftMessageChange: (message: string) => void;
  onSubmit: () => void;
};

export function AiChatComposer({
  canSubmit,
  draftMessage,
  isBusy,
  documentBadges,
  onDocumentBadgeRemove,
  onDraftMessageChange,
  onSubmit,
}: AiChatComposerProps) {
  return (
    <form
      className="pointer-events-auto bg-transparent"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <InputGroup className="pointer-events-auto min-h-28 items-stretch rounded-xl bg-ai-chat-composer shadow-sm has-disabled:bg-ai-chat-composer has-disabled:opacity-100 dark:!border-input/50 dark:!bg-ai-chat-composer dark:has-disabled:!bg-ai-chat-composer">
        {documentBadges.length > 0
          ? (
            <div className="flex w-full flex-wrap gap-1.5 px-3 pt-3">
              {documentBadges.map((documentBadge) => {
                const DocumentIcon = documentBadge.hasContent ? FileTextIcon : FileIcon;

                return (
                  <Badge
                    key={documentBadge.id}
                    variant="secondary"
                    className="group/badge relative max-w-[10rem] gap-1.5 px-2.5 py-1 text-sm leading-5 [&>svg]:size-3.5"
                  >
                    <DocumentIcon data-icon="inline-start" />
                    <span className="truncate">{documentBadge.title}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${documentBadge.title}`}
                      className="absolute top-1/2 right-1.5 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-sm bg-secondary opacity-0 shadow-sm transition-opacity group-hover/badge:opacity-100 group-focus-within/badge:opacity-100 hover:bg-background focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      onClick={() => onDocumentBadgeRemove(documentBadge.id)}
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )
          : null}

        <InputGroupTextarea
          aria-label="Message AI"
          value={draftMessage}
          placeholder="Ask AI about this workspace..."
          disabled={isBusy}
          className="min-h-12 px-3 py-2.5 text-sm leading-6"
          onChange={(event) => onDraftMessageChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey) {
              return;
            }

            event.preventDefault();
            onSubmit();
          }}
        />

        <InputGroupAddon align="block-end" className="pt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground" />
          <InputGroupButton
            type="submit"
            size="icon-sm"
            variant="default"
            className="ml-auto rounded-full"
            disabled={!canSubmit}
          >
            <ArrowUpIcon className="size-4" />
            <span className="sr-only">Send message</span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
