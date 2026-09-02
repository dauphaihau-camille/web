import { cn } from '@shared/lib/utils';

import type { AiResponseBlock, AiResponseInlineContent } from '../../../ai-chat-panel.types';

type PreviewListItemGroup = {
  block: AiResponseBlock & { type: 'bulletListItem' | 'numberedListItem' };
  children: AiResponseBlock[];
};

type PreviewGroup =
  | {
    type: 'block';
    block: AiResponseBlock;
  }
  | {
    type: 'list';
    listType: 'bulletListItem' | 'numberedListItem';
    items: PreviewListItemGroup[];
  };

export function AssistantMessagePreview({
  blocks,
  isStreaming = false,
}: {
  blocks: AiResponseBlock[];
  isStreaming?: boolean;
}) {
  const groups = groupPreviewBlocks(blocks);

  return (
    <div className="text-[13px] leading-relaxed text-foreground">
      {groups.map((group, index) => (
        <PreviewGroup
          group={group}
          isFirst={index === 0}
          key={getPreviewGroupKey(group)}
        />
      ))}
      {isStreaming && (
        <span
          aria-hidden="true"
          data-slot="stream-caret"
          className="stream-caret is-streaming"
        />
      )}
    </div>
  );
}

function PreviewGroup({ group, isFirst }: { group: PreviewGroup; isFirst: boolean }) {
  if (group.type === 'list') {
    const ListTag = group.listType === 'bulletListItem' ? 'ul' : 'ol';
    const className = cn(
      'space-y-0.5 pl-5',
      group.listType === 'bulletListItem' ? 'list-disc' : 'list-decimal',
      !isFirst && 'mt-0.5',
    );

    return (
      <ListTag className={className}>
        {group.items.map((item) => (
          <PreviewListItem item={item} key={item.block.id} />
        ))}
      </ListTag>
    );
  }

  return <PreviewBlock block={group.block} isFirst={isFirst} />;
}

function PreviewBlock({ block, isFirst }: { block: AiResponseBlock; isFirst: boolean }) {
  if (isQuoteBlock(block)) {
    return (
      <blockquote className={cn('border-l-2 border-border pl-4 font-semibold', !isFirst && 'mt-4')}>
        <PreviewContent block={removeQuoteMarker(block)} />
      </blockquote>
    );
  }

  const content = <PreviewContent block={block} />;

  if (block.type === 'heading') {
    const level = resolveHeadingLevel(block);

    const className = cn(
      'font-semibold leading-snug text-foreground',
      level === 1 && 'text-base',
      level === 2 && 'text-sm',
      level === 3 && 'text-[13px]',
      !isFirst && level === 1 && 'mt-5',
      !isFirst && level === 2 && 'mt-4',
      !isFirst && level === 3 && 'mt-3',
    );

    if (level === 1) {
      return <h1 className={className}>{content}</h1>;
    }

    if (level === 2) {
      return <h2 className={className}>{content}</h2>;
    }

    return <h3 className={className}>{content}</h3>;
  }

  return <p className={cn(!isFirst && 'mt-1')}>{content}</p>;
}

function PreviewListItem({ item }: { item: PreviewListItemGroup }) {
  return (
    <li className="pl-1">
      <div>
        <PreviewContent block={item.block} />
      </div>
      {item.children.map((child) => (
        <p className="mt-1" key={child.id}>
          <PreviewContent block={child} />
        </p>
      ))}
    </li>
  );
}

function PreviewContent({ block }: { block: AiResponseBlock }) {
  return block.content.map((inline, index) => (
    <PreviewInline
      inline={inline}
      key={`${block.id}-inline-${index}`}
    />
  ));
}

function groupPreviewBlocks(blocks: AiResponseBlock[]): PreviewGroup[] {
  const groups: PreviewGroup[] = [];

  for (const block of blocks) {
    if (!isListItemBlock(block)) {
      const previousGroup = groups.at(-1);

      if (block.type === 'paragraph' && !isQuoteBlock(block) && previousGroup?.type === 'list') {
        const previousItem = previousGroup.items.at(-1);

        if (previousItem) {
          previousItem.children.push(block);
          continue;
        }
      }

      groups.push({ type: 'block', block });
      continue;
    }

    const previousGroup = groups.at(-1);

    if (
      previousGroup?.type === 'list'
      && previousGroup.listType === block.type
    ) {
      previousGroup.items.push({ block, children: [] });
      continue;
    }

    groups.push({
      type: 'list',
      listType: block.type,
      items: [{ block, children: [] }],
    });
  }

  return groups;
}

function getPreviewGroupKey(group: PreviewGroup) {
  if (group.type === 'block') {
    return group.block.id;
  }

  return `${group.listType}-${group.items[0]?.block.id ?? 'empty'}`;
}

function isListItemBlock(
  block: AiResponseBlock,
): block is AiResponseBlock & { type: 'bulletListItem' | 'numberedListItem' } {
  return block.type === 'bulletListItem' || block.type === 'numberedListItem';
}

function isQuoteBlock(block: AiResponseBlock) {
  return block.type === 'paragraph' && block.content[0]?.text.trimStart().startsWith('>');
}

function removeQuoteMarker(block: AiResponseBlock): AiResponseBlock {
  const [firstInline, ...remainingContent] = block.content;

  if (!firstInline) {
    return block;
  }

  return {
    ...block,
    content: [
      {
        ...firstInline,
        text: firstInline.text.replace(/^\s*>\s?/, ''),
      },
      ...remainingContent,
    ],
  };
}

function PreviewInline({ inline }: { inline: AiResponseInlineContent }) {
  return (
    <span
      className={cn(
        inline.styles?.bold && 'font-semibold',
        inline.styles?.italic && 'italic',
      )}
    >
      {inline.text}
    </span>
  );
}

function resolveHeadingLevel(block: AiResponseBlock): 1 | 2 | 3 {
  if (block.props?.level === 1) {
    return 1;
  }

  if (block.props?.level === 2) {
    return 2;
  }

  return 3;
}
