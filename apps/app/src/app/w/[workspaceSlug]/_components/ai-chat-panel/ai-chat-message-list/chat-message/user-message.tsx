import type { ChatMessage as AiChatMessage } from '../../ai-chat-panel.types';

type UserMessageProps = {
  message: AiChatMessage;
};

export function UserMessage({ message }: UserMessageProps) {
  return (
    <article className="group/message flex gap-2 justify-end">
      <div className="flex flex-col gap-1.5 items-end max-w-[85%]">
        <div className="rounded-2xl text-sm leading-6 border border-border bg-muted text-foreground px-3 py-1">
          {message.content}
        </div>
      </div>
    </article>
  );
}
