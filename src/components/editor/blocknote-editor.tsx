'use client';

import { useEffect, useRef, useState } from 'react';
import {
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
} from '@blocknote/core/extensions';
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
  type DefaultReactSuggestionItem,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { FilePlus2Icon } from 'lucide-react';

import type { Document } from '@/domains/document';

import { blockNoteSchema } from './blocknote-schema';

type BlockNoteEditorProps = {
  documentTitle: string;
  content: unknown[];
  onContentChange: (content: unknown[]) => Promise<void>;
  onCreateSubpage: () => Promise<Document>;
  onSelectionChange?: () => void;
  onStartContentChange?: () => void;
};

export function BlockNoteEditor({
  documentTitle,
  content,
  onContentChange,
  onCreateSubpage,
  onSelectionChange,
  onStartContentChange,
}: BlockNoteEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSerializedContentRef = useRef(JSON.stringify(content));
  const saveTimeoutRef = useRef<number | null>(null);

  const editor = useCreateBlockNote({
    schema: blockNoteSchema,
    initialContent: content as never[],
  }, [content]);

  useEffect(() => {
    const nextSerializedContent = JSON.stringify(content);

    if (nextSerializedContent === lastSerializedContentRef.current) {
      return;
    }

    lastSerializedContentRef.current = nextSerializedContent;
  }, [content]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const getSlashMenuItems = async (query: string) => {
    const createSubpageItem: DefaultReactSuggestionItem = {
      title: 'Subpage',
      subtext: `Create a nested page inside ${documentTitle || 'this page'}`,
      aliases: ['page', 'subpage', 'nested page', 'child page'],
      group: 'Basic blocks',
      icon: <FilePlus2Icon size={18} />,
      onItemClick: () => {
        void onCreateSubpage().then((subpage) => {
          insertOrUpdateBlockForSlashMenu(editor, {
            type: 'subpage',
            props: {
              documentId: subpage.id,
              workspaceId: subpage.workspace_id,
              title: subpage.title,
            },
          });
        });
      },
    };

    return filterSuggestionItems(
      [...getDefaultReactSlashMenuItems(editor), createSubpageItem],
      query,
    );
  };

  return (
    <div className="">
      <BlockNoteView
        editor={editor}
        slashMenu={false}
        className="min-h-[60vh] bg-transparent py-6 [--bn-colors-editor-background:transparent] [&_.bn-editor]:!bg-transparent [&_.bn-editor]:!shadow-none"
        onSelectionChange={onSelectionChange}
        onChange={() => {
          const nextContent = editor.document as unknown[];
          const serializedContent = JSON.stringify(nextContent);

          if (serializedContent === lastSerializedContentRef.current) {
            return;
          }

          lastSerializedContentRef.current = serializedContent;

          if (saveTimeoutRef.current) {
            window.clearTimeout(saveTimeoutRef.current);
          }

          onStartContentChange?.();
          setIsSaving(true);
          setSaveError(null);
          saveTimeoutRef.current = window.setTimeout(() => {
            void onContentChange(nextContent)
              .then(() => {
                setIsSaving(false);
              })
              .catch(() => {
                setIsSaving(false);
                setSaveError('Save failed');
              });
          }, 500);
        }}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          shouldOpen={(state) =>
            !state.selection.$from.parent.type.isInGroup('tableContent')
          }
          getItems={getSlashMenuItems}
        />
      </BlockNoteView>
    </div>
  );
}
