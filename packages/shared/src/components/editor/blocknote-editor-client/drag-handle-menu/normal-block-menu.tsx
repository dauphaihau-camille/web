'use client';

import type { Block } from '@blocknote/core';
import { useComponentsContext } from '@blocknote/react';
import { Trash2Icon } from 'lucide-react';

import { MenuRow } from './menu-row';
import { TurnToItem } from './turn-to-item';

type NormalBlockMenuProps = {
  blocks: Block[];
  onDelete: () => void;
};

export function NormalBlockMenu({
  blocks,
  onDelete,
}: NormalBlockMenuProps) {
  const Components = useComponentsContext();

  if (!Components) {
    return null;
  }

  return (
    <>
      <TurnToItem blocks={blocks} />
      <div className="mx-1 my-1 h-px bg-border" />
      <Components.Generic.Menu.Item
        className="bn-menu-item drag-handle-menu__item drag-handle-menu__item--destructive"
        onClick={onDelete}
      >
        <MenuRow
          icon={<Trash2Icon className="size-4" />}
          label="Delete"
          shortcut="Del"
        />
      </Components.Generic.Menu.Item>
    </>
  );
}
