import { CopyIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';
import { cn } from '@shared/lib/utils';

import type { AiChatAppendResponse, ChatMessage } from '../ai-chat-panel.types';

type ChatBubbleProps = {
  message: ChatMessage;
  selectedSessionId: string;
  onAppendResponse?: AiChatAppendResponse;
};

export function ChatBubble({
  message,
  selectedSessionId,
  onAppendResponse,
}: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <article className={cn('group/message flex gap-2', isUser && 'justify-end')}>
      <div className={cn('flex max-w-full flex-col gap-1.5', isUser ? 'items-end max-w-[85%]' : 'max-w-[95%]')}>
        <div
          className={cn(
            'rounded-2xl text-sm leading-6',
            isUser
              ? 'border border-border bg-muted text-foreground px-3 py-1'
              : 'py-0',
          )}
        >
          {message.content}
        </div>

        {isUser
          ? null
          : (
            <AssistantMessageActions
              content={message.content}
              messageId={message.id}
              selectedSessionId={selectedSessionId}
              onAppendResponse={onAppendResponse}
            />
          )}
      </div>
    </article>
  );
}

function AssistantMessageActions({
  content,
  messageId,
  selectedSessionId,
  onAppendResponse,
}: {
  content: string;
  messageId: string;
  selectedSessionId: string;
  onAppendResponse?: AiChatAppendResponse;
}) {
  async function copyResponse() {
    await window.navigator.clipboard.writeText(content);
    toast('Response copied to clipboard');
  }

  async function appendResponse() {
    if (!onAppendResponse) {
      return;
    }

    try {
      await onAppendResponse({
        conversationSessionId: selectedSessionId,
        assistantMessageId: messageId,
        content,
      });
      toast('Appended to document');
    }
    catch {
      toast('Could not append to document');
    }
  }

  return (
    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100">
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

      {onAppendResponse
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
