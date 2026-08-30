import { cn } from '@shared/lib/utils';

import type { AiChatAppendResponse, ChatMessage as AiChatMessage } from '../../ai-chat-panel.types';
import { AssistantMessageActions } from './assistant-message-actions';
import { AssistantMessagePreview } from './assistant-message-preview';
import { AssistantThinkingIndicator } from './assistant-thinking-indicator';
import { StreamingText } from './streaming-text';

type AssistantMessageProps = {
  message: AiChatMessage;
  selectedSessionId: string;
  canAppendResponse: boolean;
  onAppendResponse?: AiChatAppendResponse;
};

export function AssistantMessage({
  message,
  canAppendResponse,
  selectedSessionId,
  onAppendResponse,
}: AssistantMessageProps) {
  const isAssistantPending = message.status === 'pending';
  const isAssistantStreaming = message.status === 'streaming';

  return (
    <article className="group/message flex gap-2">
      <div className="flex flex-col gap-1.5 max-w-[95%]">
        <div
          className={cn(
            'rounded-2xl text-sm leading-6 py-0',
            isAssistantPending && 'text-muted-foreground',
          )}
        >
          {isAssistantPending ? <AssistantThinkingIndicator ariaLabel="AI is thinking" /> : null}

          {isAssistantStreaming && message.streamingBlocks
            ? <AssistantMessagePreview blocks={message.streamingBlocks} isStreaming />
            : null}

          {isAssistantStreaming && !message.streamingBlocks ? <StreamingText content={message.content} isStreaming /> : null}

          {!isAssistantPending && !isAssistantStreaming && message.responseBlockPayload
            ? <AssistantMessagePreview blocks={message.responseBlockPayload} />
            : null}

          {!isAssistantPending && !isAssistantStreaming && !message.responseBlockPayload ? message.content : null}
        </div>

        {!isAssistantPending && !isAssistantStreaming
          ? (
            <AssistantMessageActions
              canAppendResponse={canAppendResponse}
              content={message.content}
              messageId={message.id}
              responseBlockPayload={message.responseBlockPayload ?? []}
              selectedSessionId={selectedSessionId}
              onAppendResponse={onAppendResponse}
            />
          )
          : null}
      </div>
    </article>
  );
}
