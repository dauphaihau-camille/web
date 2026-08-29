import type { LucideIcon } from 'lucide-react';

export type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  status?: 'pending' | 'streaming';
};

export type ChatSession = {
  id: string;
  title: string;
  group: 'Past week' | 'Older';
  messages: ChatMessage[];
};

export type ChatSuggestion = {
  id: string;
  label: string;
  messageContent: string;
  icon: LucideIcon;
  assistantContent: string;
};

export type AiChatDocumentBadge = {
  id: string;
  title: string;
};

export type AiChatAppendRequest = {
  conversationSessionId: string;
  assistantMessageId: string;
  content: string;
};

export type AiChatAppendResponse = (request: AiChatAppendRequest) => void | Promise<void>;

export type AiChatPanelProps = {
  isOpen: boolean;
  panelId: string;
  workspaceSlug: string;
  onOpenChangeAction: (isOpen: boolean) => void;
  documentBadges: AiChatDocumentBadge[];
  onDocumentBadgeRemove: (documentId: string) => void;
  onAppendResponse?: AiChatAppendResponse;
};
