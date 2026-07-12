import type { Block } from '@blocknote/core';
import { blockTypeSelectItems } from '@blocknote/react';

type DragHandleDictionary = Parameters<typeof blockTypeSelectItems>[0];

export type EditorBlock = {
  id: Block['id'];
  type: Block['type'] | 'subdoc';
  props: Record<string, unknown>;
};

export function getCurrentBlockLabel(
  block: EditorBlock,
  dictionary: DragHandleDictionary,
) {
  if (block.type === 'subdoc') {
    return 'Document';
  }

  const matchingItem = blockTypeSelectItems(dictionary).find((item) =>
    item.type === block.type
    && Object.entries(item.props ?? {}).every(
      ([propName, propValue]) => block.props[propName] === propValue,
    ),
  );

  if (matchingItem) {
    return matchingItem.name;
  }

  if (block.type === 'heading') {
    const level = block.props.level;
    return typeof level === 'number' ? `Heading ${level}` : 'Heading';
  }

  return block.type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase());
}
