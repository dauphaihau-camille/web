import { cn } from '@shared/lib/utils';

import type { AiChatAppendResponse, ChatMessage as AiChatMessage } from '../../ai-chat-panel.types';
import { AssistantMessageActions } from './assistant-message-actions';
import { AssistantThinkingIndicator } from './assistant-thinking-indicator';
import { StreamingText } from './streaming-text';

type ChatMessageProps = {
  message: AiChatMessage;
  selectedSessionId: string;
  onAppendResponse?: AiChatAppendResponse;
};

export function ChatMessage({
  message,
  selectedSessionId,
  onAppendResponse,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistantPending = !isUser && message.status === 'pending';
  const isAssistantStreaming = !isUser && message.status === 'streaming';

  return (
    <article className={cn('group/message flex gap-2', isUser && 'justify-end')}>
      <div className={cn('flex max-w-full flex-col gap-1.5', isUser ? 'items-end max-w-[85%]' : 'max-w-[95%]')}>
        <div
          className={cn(
            'rounded-2xl text-sm leading-6',
            isUser
              ? 'border border-border bg-muted text-foreground px-3 py-1'
              : 'py-0',
            isAssistantPending && 'text-muted-foreground',
          )}
        >
          {isAssistantPending ? <AssistantThinkingIndicator ariaLabel="AI is thinking" /> : null}
          {isAssistantStreaming ? <StreamingText content={message.content} isStreaming /> : null}
          {!isAssistantPending && !isAssistantStreaming ? message.content : null}
        </div>

        {!isUser && !isAssistantPending && !isAssistantStreaming
          ? (
            <AssistantMessageActions
              content={message.content}
              messageId={message.id}
              selectedSessionId={selectedSessionId}
              onAppendResponse={onAppendResponse}
            />
          )
          : null}
      </div>
    </article>
  );
}
