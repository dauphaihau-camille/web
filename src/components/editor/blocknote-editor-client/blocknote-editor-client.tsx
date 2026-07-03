'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';
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
import { useDebounceFn } from 'ahooks';
import { FilePlus2Icon } from 'lucide-react';

import type { Document } from '@/domains/document';

import { blockNoteSchema } from '../blocknote-schema';
import { NotionLikeSlashMenu } from './notion-like-slash-menu';

type BlockNoteEditorClientProps = {
  documentTitle: string;
  content: unknown[];
  documentId?: string;
  workspaceSlug?: string;
  editable?: boolean;
  onContentChangeAction?: (content: unknown[]) => Promise<void>;
  onCreateSubdocAction?: () => Promise<Document>;
  onSelectionChangeAction?: () => void;
  onStartContentChangeAction?: () => void;
};

export function BlockNoteEditorClient({
  documentTitle,
  content,
  documentId: _documentId,
  workspaceSlug = '',
  editable = true,
  onContentChangeAction,
  onCreateSubdocAction,
  onSelectionChangeAction,
  onStartContentChangeAction,
}: BlockNoteEditorClientProps) {
  const [_isSaving, setIsSaving] = useState(false);
  const [_saveError, setSaveError] = useState<string | null>(null);
  const [slashMenuQuery, setSlashMenuQuery] = useState('');
  const lastSerializedContentRef = useRef(JSON.stringify(content));

  const editor = useCreateBlockNote({
    schema: blockNoteSchema,
    initialContent: content as never[],
  }, []);

  const { run: scheduleSave, cancel: cancelScheduledSave } = useDebounceFn(
    (nextContent: unknown[]) => {
      if (!onContentChangeAction) {
        return;
      }

      void onContentChangeAction(nextContent)
        .then(() => {
          setIsSaving(false);
        })
        .catch(() => {
          setIsSaving(false);
          setSaveError('Save failed');
        });
    },
    { wait: 500 },
  );

  useEffect(() => {
    const nextSerializedContent = JSON.stringify(content);

    if (nextSerializedContent === lastSerializedContentRef.current) {
      return;
    }

    lastSerializedContentRef.current = nextSerializedContent;
  }, [content]);

  useEffect(() => {
    return () => {
      cancelScheduledSave();
    };
  }, [cancelScheduledSave]);

  const isEditable = editable && Boolean(onContentChangeAction);

  const getSlashMenuItems = async (query: string) => {
    setSlashMenuQuery(query);

    const defaultItems = getDefaultReactSlashMenuItems(editor);

    if (!onCreateSubdocAction) {
      return filterSuggestionItems(
        defaultItems,
        query,
      );
    }

    const createSubdoc = onCreateSubdocAction;

    const createSubdocItem: DefaultReactSuggestionItem = {
      title: 'Document',
      subtext: `Create a nested doc inside ${documentTitle || 'this doc'}`,
      aliases: ['doc', 'document', 'subdoc', 'nested doc', 'child doc'],
      group: 'Basic blocks',
      icon: <FilePlus2Icon size={18} />,
      onItemClick: () => {
        void createSubdoc().then((subdoc) => {
          insertOrUpdateBlockForSlashMenu(editor, {
            type: 'subpage',
            props: {
              documentId: subdoc.id,
              publicId: subdoc.public_id,
              workspaceId: workspaceSlug,
              title: subdoc.title,
            },
          });
        });
      },
    };

    const insertIndex = defaultItems.findIndex((item) => item.title === 'Divider');
    const slashMenuItems = [...defaultItems];

    if (insertIndex === -1) {
      slashMenuItems.push(createSubdocItem);
    }
    else {
      slashMenuItems.splice(insertIndex, 0, createSubdocItem);
    }

    return filterSuggestionItems(
      slashMenuItems,
      query,
    );
  };

  return (
    <div className="editor-blocknote-client">
      <BlockNoteView
        editor={editor}
        editable={isEditable}
        slashMenu={false}
        className="min-h-[60vh] bg-transparent py-2 [--bn-colors-editor-background:transparent] [&_.bn-editor]:!bg-transparent [&_.bn-editor]:!shadow-none"
        onSelectionChange={onSelectionChangeAction}
        onChange={() => {
          if (!isEditable || !onContentChangeAction) {
            return;
          }

          const nextContent = editor.document as unknown[];
          const serializedContent = JSON.stringify(nextContent);

          if (serializedContent === lastSerializedContentRef.current) {
            return;
          }

          lastSerializedContentRef.current = serializedContent;

          onStartContentChangeAction?.();
          setIsSaving(true);
          setSaveError(null);
          scheduleSave(nextContent);
        }}
      >
        {isEditable
          ? (
            <SuggestionMenuController
              triggerCharacter="/"
              shouldOpen={(state) =>
                !state.selection.$from.parent.type.isInGroup('tableContent')
              }
              getItems={getSlashMenuItems}
              suggestionMenuComponent={(props) => (
                <NotionLikeSlashMenu
                  {...props}
                  query={slashMenuQuery}
                />
              )}
            />
          )
          : null}
      </BlockNoteView>

      <style>{`
        .editor-blocknote-client
          .bn-block-content:not([data-content-type="subpage"])
          > .bn-inline-content {
          padding-left: 14px;
        }

        .editor-blocknote-client
          .bn-block-content:not([data-content-type="subpage"]):has(.ProseMirror-trailingBreak:only-child)::after {
          color: var(--muted-foreground);
          margin-left: 1px;
        }

        .bn-side-menu .bn-button {
          height: 24px;
          width: 24px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--muted-foreground);
          background-color: transparent;
          transition:
            background-color 150ms ease,
            color 150ms ease,
            box-shadow 150ms ease;
        }

        .bn-side-menu .bn-button svg {
          height: 17px;
          width: 17px;
        }

        .bn-side-menu .bn-button:hover {
          background-color: var(--muted) !important;
          color: var(--foreground) !important;
        }

        .bn-side-menu .bn-button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px color-mix(in oklab, var(--ring) 50%, transparent);
        }
      `}</style>
    </div>
  );
}
