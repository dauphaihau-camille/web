import { AlignLeftIcon } from 'lucide-react';

import type { ChatSession, ChatSuggestion } from './ai-chat-panel.types';

export const mockChatSessions: ChatSession[] = [
  {
    id: 'untitled',
    title: 'Untitled',
    group: 'Past week',
    messages: [
      {
        id: 'mock-user-streaming-scroll',
        role: 'user',
        content: 'I\'m building a chat for our app and the scroll behavior is driving me nuts. Every time the AI streams a reply, the whole thread jumps around.',
      },
      {
        id: 'mock-assistant-streaming-scroll',
        role: 'assistant',
        content: 'That\'s the classic streaming scroll problem. Wrap your message list in `MessageScroller` and turn on `autoScroll` — the viewport pins to the bottom as tokens arrive, so users always see the latest text land in place.\n\nThe important part: it only auto-scrolls while the reader is already at the bottom. The moment they scroll up to read something earlier, auto-scroll backs off and their position is preserved. You get smooth streaming without fighting the user\'s intent.',
      },
      {
        id: 'mock-user-turn-anchor',
        role: 'user',
        content: 'Okay, but when someone sends a new message the view still feels jarring — like the whole conversation reloads from the top.',
      },
      {
        id: 'mock-assistant-turn-anchor',
        role: 'assistant',
        content: 'MessageScrollerItem fixes that with turn anchoring. Set `scrollAnchor` on the turn that should settle near the top instead of blindly snapping to the document bottom.\n\nIt also leaves a small peek of the previous exchange visible above the anchor, so context isn\'t lost. The reply starts in view without that disorienting jump you get from a plain overflow container.',
      },
      {
        id: 'mock-user-reader-intent',
        role: 'user',
        content: 'And if they\'ve scrolled up to re-read an older answer? I don\'t want to yank them back down.',
      },
      {
        id: 'mock-assistant-reader-intent',
        role: 'assistant',
        content: 'You won\'t. Auto-scroll only runs when the viewport is already pinned to the bottom, so scrolling up is a deliberate opt-out — their place in the thread stays put even as new tokens keep arriving below.\n\nWhen there is content they haven\'t seen yet, `MessageScrollerButton` appears at the bottom of the viewport. One tap jumps them back to the newest message and re-engages auto-scroll. Same pattern as Slack or iMessage: quiet when you\'re caught up, helpful when you\'re not.',
      },
      {
        id: 'mock-user-assistive-tech',
        role: 'user',
        content: 'Last one — does this work with assistive tech?',
      },
      {
        id: 'mock-assistant-assistive-tech',
        role: 'assistant',
        content: '`MessageScrollerContent` sets `role="log"` and `aria-relevant="additions"` by default, so screen readers announce new messages as they stream in.\n\nThe scroll button is a real `<button>` with an sr-only label, and it\'s removed from the tab order when you\'re already at the bottom — no ghost focus stops.',
      },
    ],
  },
  {
    id: 'ai-abuse-impact',
    title: 'Impact of AI abuse on intuition',
    group: 'Older',
    messages: [
      {
        id: 'mock-ai-abuse-user',
        role: 'user',
        content: 'Can overusing AI weaken my intuition?',
      },
      {
        id: 'mock-ai-abuse-assistant',
        role: 'assistant',
        content: 'It can if you outsource the first pass every time. Use AI after you make a small prediction, then compare the answer against your own reasoning.',
      },
    ],
  },
  {
    id: 'typescript-basics',
    title: 'Khái niệm cơ bản TypeScript',
    group: 'Older',
    messages: [
      {
        id: 'mock-typescript-user',
        role: 'user',
        content: 'Giải thích type và interface khác nhau thế nào.',
      },
      {
        id: 'mock-typescript-assistant',
        role: 'assistant',
        content: '`interface` phù hợp khi mô tả object shape có thể mở rộng. `type` linh hoạt hơn cho union, tuple, primitive alias, và composition phức tạp.',
      },
    ],
  },
  {
    id: 'explain-this-page',
    title: 'Explain this page',
    group: 'Older',
    messages: [
      {
        id: 'mock-explain-page-user',
        role: 'user',
        content: 'Explain this page.',
      },
      {
        id: 'mock-explain-page-assistant',
        role: 'assistant',
        content: 'I can explain the current page once page context is connected.',
      },
    ],
  },
  {
    id: 'simple-greeting',
    title: 'Simple greeting',
    group: 'Older',
    messages: [],
  },
  {
    id: 'suggest-goals',
    title: 'Suggest some goals',
    group: 'Older',
    messages: [
      {
        id: 'mock-suggest-goals-user',
        role: 'user',
        content: 'Suggest some goals for this workspace.',
      },
      {
        id: 'mock-suggest-goals-assistant',
        role: 'assistant',
        content: 'Start with one writing goal, one review goal, and one publishing goal. Keep each goal measurable and tied to a weekly cadence.',
      },
    ],
  },
];

export const initialMessagesBySessionId = Object.fromEntries(
  mockChatSessions.map((session) => [session.id, session.messages]),
);

export const mockResponseDelayMs = 1000;

export const emptyChatSuggestions: ChatSuggestion[] = [
  {
    id: 'summary',
    label: 'Summarize this page',
    messageContent: 'Summarize this page',
    icon: AlignLeftIcon,
    assistantContent: 'I can summarize the current page once page context is connected.',
  },
  // {
  //   id: 'translate',
  //   label: 'Translate this page',
  //   icon: LanguagesIcon,
  //   assistantContent: 'I can translate the current page once page context is connected.',
  // },
];
