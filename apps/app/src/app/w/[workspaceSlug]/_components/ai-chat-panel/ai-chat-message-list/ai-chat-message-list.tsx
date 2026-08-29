import { ChevronDownIcon } from 'lucide-react';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';

import type { AiChatAppendResponse, ChatMessage as AiChatMessage } from '../ai-chat-panel.types';
import { ChatMessage } from './chat-message/chat-message';

type AiChatMessageListProps = {
  isBusy: boolean;
  messages: AiChatMessage[];
  onAppendResponse?: AiChatAppendResponse;
  onLoadOlder: () => void;
  selectedSessionId: string;
};

export function AiChatMessageList({
  isBusy,
  messages,
  onAppendResponse,
  onLoadOlder,
  selectedSessionId,
}: AiChatMessageListProps) {
  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller className="flex-1">
        <MessageScrollerViewport
          className="app-scrollbar"
          onScroll={(event) => {
            if (event.currentTarget.scrollTop <= 80) {
              onLoadOlder();
            }
          }}
        >
          <MessageScrollerContent aria-busy={isBusy} className="px-4 py-5">
            {messages.map((message) => (
              <MessageScrollerItem
                key={message.id}
                messageId={message.id}
                scrollAnchor={message.role === 'user'}
              >
                <ChatMessage message={message} selectedSessionId={selectedSessionId} onAppendResponse={onAppendResponse} />
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>

        <MessageScrollerButton className="rounded-full border-transparent bg-foreground text-background hover:bg-foreground/90 hover:text-background pt-0.5 size-8">
          <ChevronDownIcon className="size-5" />
          <span className="sr-only">Scroll to end</span>
        </MessageScrollerButton>

      </MessageScroller>
    </MessageScrollerProvider>
  );
}
