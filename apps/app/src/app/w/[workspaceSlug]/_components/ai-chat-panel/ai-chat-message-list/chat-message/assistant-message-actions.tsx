import { CopyIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';

import type { AiChatAppendResponse, AiResponseBlockPayload } from '../../ai-chat-panel.types';

type AssistantMessageActionsProps = {
  canAppendResponse: boolean;
  content: string;
  messageId: string;
  responseBlockPayload: AiResponseBlockPayload;
  selectedSessionId: string;
  onAppendResponse?: AiChatAppendResponse;
};

export function AssistantMessageActions({
  canAppendResponse,
  content,
  responseBlockPayload,
  messageId,
  selectedSessionId,
  onAppendResponse,
}: AssistantMessageActionsProps) {
  async function copyResponse() {
    await window.navigator.clipboard.writeText(content);
    toast('Response copied to clipboard');
  }

  async function appendResponse() {
    if (!onAppendResponse || !canAppendResponse) {
      return;
    }

    try {
      await onAppendResponse({
        conversationSessionId: selectedSessionId,
        assistantMessageId: messageId,
        content,
        responseBlockPayload,
      });
      toast('Appended to document');
    }
    catch {
      toast('Could not append to document');
    }
  }

  return (
    <div data-slot="assistant-message-actions" className="flex items-center gap-1 opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100">
      <Tooltip>
        <TooltipTrigger
          delay={0}
          render={(
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Copy response"
              className="size-6 text-muted-foreground p-3.5"
              onClick={() => {
                void copyResponse();
              }}
            >
              <CopyIcon className="size-4" />
            </Button>
          )}
        />
        <TooltipContent side="top">Copy response</TooltipContent>
      </Tooltip>

      {canAppendResponse
        ? (
          <Tooltip>
            <TooltipTrigger
              delay={0}
              render={(
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Append to this document"
                  disabled={!onAppendResponse}
                  className="size-6 text-muted-foreground p-3.5"
                  onClick={() => {
                    void appendResponse();
                  }}
                >
                  <PlusIcon className="size-4" />
                </Button>
              )}
            />
            <TooltipContent side="top">Append to this document</TooltipContent>
          </Tooltip>
        )
        : null}
    </div>
  );
}
