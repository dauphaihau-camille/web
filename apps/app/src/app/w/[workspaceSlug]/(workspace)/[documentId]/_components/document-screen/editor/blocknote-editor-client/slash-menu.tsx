'use client';

import type { SharedSlashMenuProps } from '@shared/components/editor/blocknote-editor-client/slash-menu';
import { SharedSlashMenu } from '@shared/components/editor/blocknote-editor-client/slash-menu';

export function SlashMenu(props: SharedSlashMenuProps) {
  return (
    <SharedSlashMenu
      {...props}
      showMediaHints={false}
    />
  );
}
