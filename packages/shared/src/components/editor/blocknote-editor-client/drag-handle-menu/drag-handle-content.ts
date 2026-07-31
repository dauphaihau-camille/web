import type { Block } from '@blocknote/core';

export function removeBlocksFromContent(
  blocks: Block[],
  blockIdsToRemove: Set<string>,
): Block[] {
  return blocks.flatMap((block) => {
    if (blockIdsToRemove.has(block.id)) {
      return [];
    }

    const nextChildren = removeBlocksFromContent(
      (block.children ?? []) as Block[],
      blockIdsToRemove,
    );

    if (nextChildren === block.children) {
      return [block];
    }

    return [{
      ...block,
      children: nextChildren,
    } as Block];
  });
}
