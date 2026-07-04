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
  SideMenuController,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
  type DefaultReactSuggestionItem,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { useDebounceFn } from 'ahooks';
import { FilePlus2Icon } from 'lucide-react';
import { useTheme } from 'next-themes';

import type { BlockNoteEditorProps } from '../blocknote-editor.types';

import { cn } from '@/lib/utils';

import { blockNoteSchema } from '../blocknote-schema';
import { EditorSideMenu } from './side-menu';
import { SlashMenu } from './slash-menu';

export function BlockNoteEditorClient({
  documentTitle,
  content,
  documentId: _documentId,
  workspaceSlug = '',
  editable = true,
  documentOperations,
  onContentChangeAction,
  onCreateSubdocAction,
  onSelectionChangeAction,
  onStartContentChangeAction,
}: BlockNoteEditorProps) {
  const [_isSaving, setIsSaving] = useState(false);
  const [_saveError, setSaveError] = useState<string | null>(null);
  const [slashMenuQuery, setSlashMenuQuery] = useState('');
  const lastSerializedContentRef = useRef(JSON.stringify(content));
  const { resolvedTheme } = useTheme();

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
    editor.replaceBlocks(editor.document, content as never[]);
  }, [content, editor]);

  useEffect(() => {
    return () => {
      cancelScheduledSave();
    };
  }, [cancelScheduledSave]);

  const isEditable = editable && Boolean(onContentChangeAction);

  const blockNoteViewClassName = cn(
    'min-h-[60vh] bg-transparent py-2',
    '[--bn-colors-editor-background:transparent]',
    '[--bn-colors-editor-text:var(--color-foreground)]',
    '[--bn-colors-menu-text:var(--color-popover-foreground)]',
    '[--bn-colors-menu-background:var(--color-popover)]',
    '[--bn-colors-tooltip-text:var(--color-popover-foreground)]',
    '[--bn-colors-tooltip-background:var(--color-popover)]',
    '[--bn-colors-hovered-text:var(--color-accent-foreground)]',
    '[--bn-colors-hovered-background:var(--color-accent)]',
    '[--bn-colors-selected-text:var(--color-accent-foreground)]',
    '[--bn-colors-selected-background:var(--color-accent)]',
    '[--bn-colors-border:color-mix(in_oklab,var(--color-foreground)_10%,transparent)]',
    '[--bn-colors-shadow:color-mix(in_oklab,var(--color-foreground)_12%,transparent)]',
    '[--bn-colors-side-menu:var(--color-muted-foreground)]',
  );

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
        sideMenu={false}
        editor={editor}
        editable={isEditable}
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        slashMenu={false}
        className={blockNoteViewClassName}
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
            <>
              <SideMenuController
                sideMenu={() => (
                  <EditorSideMenu documentOperations={documentOperations} />
                )}
              />
              <SuggestionMenuController
                triggerCharacter="/"
                shouldOpen={(state) =>
                  !state.selection.$from.parent.type.isInGroup('tableContent')
                }
                getItems={getSlashMenuItems}
                suggestionMenuComponent={(props) => (
                  <SlashMenu
                    {...props}
                    query={slashMenuQuery}
                  />
                )}
              />
            </>
          )
          : null}
      </BlockNoteView>

      <style>{`
        .editor-blocknote-client
          .bn-block-content:not([data-content-type="subpage"])
          > .bn-inline-content {
          padding-left: 11px;
          color: var(--color-foreground) !important;
        }

        .editor-blocknote-client
          .bn-block-content:not([data-content-type="subpage"]):has(.ProseMirror-trailingBreak:only-child)::after {
          color: var(--color-muted-foreground);
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

        .drag-handle-menu,
        .drag-handle-submenu {
          width: min(14rem, calc(100vw - 2rem));
          min-width: 12rem;
          border-radius: 0.75rem;
          border: 1px solid color-mix(in oklab, var(--color-foreground) 10%, transparent);
          background: var(--color-popover);
          color: var(--color-popover-foreground);
          padding: 0.25rem;
          box-shadow: 0 12px 32px color-mix(in oklab, var(--color-foreground) 12%, transparent);
        }

        .drag-handle-menu .bn-menu-item {
          cursor: default;
          border-radius: 0.375rem;
          padding: 0.375rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
          color: inherit;
          outline: none;
          user-select: none;
          transition:
            background-color 150ms ease,
            color 150ms ease;
        }

        .drag-handle-menu .bn-menu-item:hover,
        .drag-handle-menu .bn-menu-item[data-highlighted] {
          background: var(--color-accent) !important;
          color: var(--color-accent-foreground) !important;
        }

        .drag-handle-menu .bn-menu-item:hover svg,
        .drag-handle-menu .bn-menu-item[data-highlighted] svg {
          color: currentColor;
        }

        .drag-handle-menu__item--destructive:hover,
        .drag-handle-menu__item--destructive[data-highlighted] {
          color: var(--color-destructive) !important;
        }

        .bn-color-picker-dropdown [data-slot="dropdown-menu-checkbox-item"] {
          padding-left: 0.5rem;
          padding-right: 2rem;
        }

        .bn-color-picker-dropdown [data-slot="dropdown-menu-checkbox-item"] > span {
          left: auto;
          right: 0.5rem;
        }

        .bn-color-picker-dropdown .bn-menu-label,
        .bn-color-picker-dropdown [data-slot="dropdown-menu-label"] {
          padding: 0.25rem 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          line-height: 1rem;
          color: var(--color-muted-foreground);
        }

        .bn-color-picker-dropdown [data-slot="dropdown-menu-label"]:not(:first-child) {
          margin-top: 0.375rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--color-border);
        }
      `}</style>
    </div>
  );
}
