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
  canAppendResponse: boolean;
  onAppendResponse?: AiChatAppendResponse;
  onLoadOlder: () => void;
  selectedSessionId: string;
};

export function AiChatMessageList({
  canAppendResponse,
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
          <MessageScrollerContent aria-busy={isBusy} className="pl-4 pr-2 pt-5 pb-[calc(var(--ai-chat-composer-dock-height,0px)+1rem)]">
            {messages.map((message) => (
              <MessageScrollerItem
                key={message.id}
                messageId={message.id}
                scrollAnchor={message.role === 'user'}
              >
                <ChatMessage
                  canAppendResponse={canAppendResponse}
                  message={message}
                  selectedSessionId={selectedSessionId}
                  onAppendResponse={onAppendResponse}
                />
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>

        <MessageScrollerButton className="size-8 rounded-full border-transparent bg-foreground pt-0.5 text-background hover:bg-foreground/90 hover:text-background data-[direction=end]:bottom-[calc(var(--ai-chat-composer-dock-height,0px)-1rem)]">
          <ChevronDownIcon className="size-5" />
          <span className="sr-only">Scroll to end</span>
        </MessageScrollerButton>

      </MessageScroller>
    </MessageScrollerProvider>
  );
}
