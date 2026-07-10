'use client';

import { useComponentsContext } from '@blocknote/react';
import {
  CopyIcon,
  LinkIcon,
  Trash2Icon,
} from 'lucide-react';

import type { BlockNoteDocumentOperations } from '../../blocknote-editor.types';
import { MenuRow } from './menu-row';

type SubdocBlockMenuProps = {
  documentOperations: BlockNoteDocumentOperations;
  isArchivingSubdocument: boolean;
  subdocumentId: string | null;
  onArchive: () => void;
};

export function SubdocBlockMenu({
  documentOperations,
  isArchivingSubdocument,
  subdocumentId,
  onArchive,
}: SubdocBlockMenuProps) {
  const Components = useComponentsContext();

  if (!Components) {
    return null;
  }

  return (
    <>
      <Components.Generic.Menu.Item
        className="bn-menu-item drag-handle-menu__item"
        onClick={() => {
          if (documentOperations.isDuplicating || !subdocumentId) {
            return;
          }

          documentOperations.onDuplicate(subdocumentId);
        }}
      >
        <MenuRow
          icon={<CopyIcon className="size-4" />}
          label={documentOperations.isDuplicating ? 'Duplicating...' : 'Duplicate'}
          shortcut={'\u2318D'}
        />
      </Components.Generic.Menu.Item>
      <Components.Generic.Menu.Item
        className="bn-menu-item drag-handle-menu__item"
        onClick={() => {
          void documentOperations.onCopyLink();
        }}
      >
        <MenuRow
          icon={<LinkIcon className="size-4" />}
          label="Copy link"
          shortcut={'\u21e7\u2318L'}
        />
      </Components.Generic.Menu.Item>
      <Components.Generic.Menu.Item
        className="bn-menu-item drag-handle-menu__item drag-handle-menu__item--destructive"
        onClick={onArchive}
      >
        <MenuRow
          icon={<Trash2Icon className="size-4" />}
          label={isArchivingSubdocument ? 'Moving to Trash...' : 'Move to Trash'}
        />
      </Components.Generic.Menu.Item>
    </>
  );
}
