'use client';

import type { ReactNode } from 'react';
import type {
  DefaultReactSuggestionItem,
  SuggestionMenuProps,
} from '@blocknote/react';

import { ScrollArea } from '../../ui/scroll-area';
import { cn } from '../../../lib/utils';

export type SharedSlashMenuProps = Pick<
  SuggestionMenuProps<DefaultReactSuggestionItem>,
  'items' | 'loadingState' | 'selectedIndex' | 'onItemClick'
> & {
  query: string;
  showMediaHints?: boolean;
};

function getSlashMenuHints(showMediaHints: boolean): Record<string, string> {
  return {
    paragraph: 'T',
    text: 'T',
    'heading 1': '#',
    'heading 2': '##',
    'heading 3': '###',
    'heading 4': '####',
    'heading 5': '#####',
    'heading 6': '######',
    'bullet list': '-',
    'bulleted list': '-',
    'numbered list': '1.',
    'check list': '[]',
    'to-do list': '[]',
    'toggle list': '>',
    quote: '"',
    divider: '---',
    'code block': '```',
    table: '+',
    ...(showMediaHints
      ? {
        image: '/image',
        video: '/video',
        audio: '/audio',
        file: '/file',
      }
      : {}),
    emoji: ':',
    document: '/doc',
    subdoc: '/subdoc',
  };
}

function getSlashMenuHint(
  item: DefaultReactSuggestionItem,
  showMediaHints: boolean,
) {
  const titleKey = item.title.toLowerCase();
  return getSlashMenuHints(showMediaHints)[titleKey];
}

export function SharedSlashMenu({
  items,
  loadingState,
  selectedIndex,
  onItemClick,
  query,
  showMediaHints = true,
}: SharedSlashMenuProps) {
  if (loadingState === 'loaded' && items.length === 0) {
    return null;
  }

  let currentGroup: string | undefined;
  const renderedItems: ReactNode[] = [];
  const hasSearchQuery = query.trim().length > 0;
  const shouldScroll = !hasSearchQuery && items.length > 8;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    if (item.group !== currentGroup) {
      if (currentGroup !== undefined) {
        renderedItems.push(
          <div
            key={`separator-${currentGroup}-${item.group}`}
            className="mx-1 my-1 h-px bg-border"
          />,
        );
      }

      currentGroup = item.group;
      renderedItems.push(
        <div
          key={`group-${currentGroup}`}
          className="px-1.5 py-1 text-xs font-medium text-muted-foreground"
        >
          {currentGroup}
        </div>,
      );
    }

    renderedItems.push(
      <button
        key={`${item.group}-${item.title}`}
        type="button"
        className={cn(
          'group relative flex w-full cursor-default items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm text-foreground outline-hidden transition-colors select-none',
          index === selectedIndex && (hasSearchQuery || selectedIndex !== 0)
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent hover:text-accent-foreground',
        )}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onItemClick?.(item)}
      >
        <div className="flex size-4 shrink-0 items-center justify-center text-muted-foreground group-hover:text-accent-foreground">
          {item.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{item.title}</div>
        </div>
        {getSlashMenuHint(item, showMediaHints)
          ? (
            <div className="shrink-0 text-xs tracking-widest text-muted-foreground group-hover:text-accent-foreground">
              {getSlashMenuHint(item, showMediaHints)}
            </div>
          )
          : null}
      </button>,
    );
  }

  return (
    <div className="w-[min(16rem,calc(100vw-2rem))]">
      <div className="min-w-32 rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10">
        {shouldScroll
          ? (
            <ScrollArea className="h-112">
              <div className="p-1 pr-3">
                {renderedItems}

                {loadingState !== 'loaded'
                  ? (
                    <div className="px-3 py-6 text-sm text-muted-foreground">
                      Searching...
                    </div>
                  )
                  : null}
              </div>
            </ScrollArea>
          )
          : (
            <div className="p-1 pr-2">
              {renderedItems}

              {loadingState !== 'loaded'
                ? (
                  <div className="px-3 py-6 text-sm text-muted-foreground">
                    Searching...
                  </div>
                )
                : null}
            </div>
          )}
      </div>
    </div>
  );
}
