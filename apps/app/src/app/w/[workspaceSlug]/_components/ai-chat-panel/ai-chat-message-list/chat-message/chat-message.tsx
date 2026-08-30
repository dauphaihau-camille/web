import type { AiChatAppendResponse, ChatMessage as AiChatMessage } from '../../ai-chat-panel.types';
import { AssistantMessage } from './assistant-message';
import { UserMessage } from './user-message';

type ChatMessageProps = {
  message: AiChatMessage;
  selectedSessionId: string;
  canAppendResponse: boolean;
  onAppendResponse?: AiChatAppendResponse;
};

export function ChatMessage({
  message,
  canAppendResponse,
  selectedSessionId,
  onAppendResponse,
}: ChatMessageProps) {
  if (message.role === 'user') {
    return <UserMessage message={message} />;
  }

  return (
    <AssistantMessage
      canAppendResponse={canAppendResponse}
      message={message}
      selectedSessionId={selectedSessionId}
      onAppendResponse={onAppendResponse}
    />
  );
}
