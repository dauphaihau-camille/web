'use client';

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type RefObject,
} from 'react';
import {
  createExtension,
} from '@blocknote/core';
import {
  filterSuggestionItems,
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
import { useTheme } from 'next-themes';

import { cn } from '../../../lib/utils';
import type { BlockNoteEditorProps } from '../blocknote-editor.types';
import { dragHandleMenuSelectionExtension } from './drag-handle-menu-selection-extension';
import { EditorSideMenuController } from './side-menu-controller';
import type { SharedSlashMenuProps } from './slash-menu';

const editorKeyboardExtension = createExtension({
  key: 'select-current-block',
  keyboardShortcuts: {
    'Mod-a': ({ editor }) => {
      const { selection } = editor.prosemirrorState;
      const { $head } = selection;

      if (!$head.parent.isTextblock) {
        return false;
      }

      return editor._tiptapEditor
        .chain()
        .focus()
        .setTextSelection({
          from: $head.start(),
          to: $head.end(),
        })
        .run();
    },
  },
});

type CreateSubdocSelectionContext = {
  cancelScheduledSave: () => void;
  createSubdoc: NonNullable<BlockNoteEditorProps['onCreateSubdocAction']>;
  documentTitle: string;
  editor: ReturnType<typeof useCreateBlockNote>;
  isExecutingSlashCommandRef: RefObject<boolean>;
  isSelectingSlashMenuItemRef: RefObject<boolean>;
  lastSerializedContentRef: RefObject<string>;
  pendingSlashMenuSaveRef: RefObject<unknown[] | null>;
  setIsSaving: (value: boolean) => void;
  slashMenuQuery: string;
  workspaceSlug: string;
};

type CreateBlockNoteEditorClientOptions = {
  SlashMenuComponent: ComponentType<SharedSlashMenuProps>;
  hiddenSlashMenuTitles?: string[];
  normalizeContent?: (content: unknown[]) => unknown[];
  schema: NonNullable<Parameters<typeof useCreateBlockNote>[0]>['schema'];
  shouldSkipSaveWhileExecutingSlashCommand?: boolean;
  styles: string;
  onCreateSubdocSelection: (context: CreateSubdocSelectionContext) => void;
};

export function createBlockNoteEditorClient({
  SlashMenuComponent,
  hiddenSlashMenuTitles = [],
  normalizeContent,
  schema,
  shouldSkipSaveWhileExecutingSlashCommand = false,
  styles,
  onCreateSubdocSelection,
}: CreateBlockNoteEditorClientOptions) {
  const hiddenSlashMenuTitleSet = new Set(hiddenSlashMenuTitles);

  return function BlockNoteEditorClient({
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
    const isSlashMenuOpenRef = useRef(false);
    const isSelectingSlashMenuItemRef = useRef(false);
    const isExecutingSlashCommandRef = useRef(false);
    const pendingSlashMenuSaveRef = useRef<unknown[] | null>(null);
    const { resolvedTheme } = useTheme();
    const normalizedContent = normalizeContent ? normalizeContent(content) : content;

    const editor = useCreateBlockNote({
      schema,
      initialContent: normalizedContent as never[],
      extensions: [
        editorKeyboardExtension,
        dragHandleMenuSelectionExtension(),
      ],
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
      const nextSerializedContent = JSON.stringify(normalizedContent);

      if (nextSerializedContent === lastSerializedContentRef.current) {
        return;
      }

      // External content updates (for example command responses) supersede any
      // debounced local save that was queued against the previous version.
      cancelScheduledSave();
      setIsSaving(false);
      setSaveError(null);
      lastSerializedContentRef.current = nextSerializedContent;
      editor.replaceBlocks(editor.document, normalizedContent as never[]);
    }, [cancelScheduledSave, normalizedContent, editor]);

    useEffect(() => {
      return () => {
        cancelScheduledSave();
      };
    }, [cancelScheduledSave]);

    const flushPendingSlashMenuSave = () => {
      if (
        isSelectingSlashMenuItemRef.current
        || (
          shouldSkipSaveWhileExecutingSlashCommand
          && isExecutingSlashCommandRef.current
        )
      ) {
        isSelectingSlashMenuItemRef.current = false;
        pendingSlashMenuSaveRef.current = null;
        return;
      }

      const pendingContent = pendingSlashMenuSaveRef.current;

      if (!pendingContent || !onContentChangeAction) {
        pendingSlashMenuSaveRef.current = null;
        return;
      }

      pendingSlashMenuSaveRef.current = null;
      onStartContentChangeAction?.();
      setIsSaving(true);
      setSaveError(null);
      scheduleSave(pendingContent);
    };

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') {
          return;
        }

        const target = event.target;

        if (!(target instanceof Element) || !editor.isWithinEditor(target)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
      };

      document.addEventListener('keydown', handleKeyDown, true);

      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }, [editor]);

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

      const defaultItems = getDefaultReactSlashMenuItems(editor).filter(
        (item) => !hiddenSlashMenuTitleSet.has(item.title),
      );

      if (!onCreateSubdocAction) {
        return filterSuggestionItems(
          defaultItems,
          query,
        );
      }

      const createSubdocItem: DefaultReactSuggestionItem = {
        title: 'Document',
        subtext: `Create a nested doc inside ${documentTitle || 'this doc'}`,
        aliases: ['doc', 'document', 'subdoc', 'nested doc', 'child doc'],
        group: 'Basic blocks',
        icon: <FilePlus2Icon size={18} />,
        onItemClick: () => {
          onCreateSubdocSelection({
            cancelScheduledSave,
            createSubdoc: onCreateSubdocAction,
            documentTitle,
            editor,
            isExecutingSlashCommandRef,
            isSelectingSlashMenuItemRef,
            lastSerializedContentRef,
            pendingSlashMenuSaveRef,
            setIsSaving,
            slashMenuQuery,
            workspaceSlug,
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

            if (
              shouldSkipSaveWhileExecutingSlashCommand
              && isExecutingSlashCommandRef.current
            ) {
              pendingSlashMenuSaveRef.current = null;
              return;
            }

            if (isSlashMenuOpenRef.current) {
              pendingSlashMenuSaveRef.current = nextContent;
              return;
            }

            onStartContentChangeAction?.();
            setIsSaving(true);
            setSaveError(null);
            scheduleSave(nextContent);
          }}
        >
          {isEditable
            ? (
              <>
                <EditorSideMenuController
                  documentOperations={documentOperations}
                />
                <SuggestionMenuController
                  triggerCharacter="/"
                  shouldOpen={(state) =>
                    !state.selection.$from.parent.type.isInGroup('tableContent')
                  }
                  onItemClick={(item) => {
                    isSelectingSlashMenuItemRef.current = true;
                    item.onItemClick();
                  }}
                  floatingUIOptions={{
                    useFloatingOptions: {
                      onOpenChange: (open) => {
                        isSlashMenuOpenRef.current = open;

                        if (open) {
                          pendingSlashMenuSaveRef.current = editor.document as unknown[];
                          cancelScheduledSave();
                          setIsSaving(false);
                          return;
                        }

                        flushPendingSlashMenuSave();
                      },
                    },
                  }}
                  getItems={getSlashMenuItems}
                  suggestionMenuComponent={(props) => (
                    <SlashMenuComponent
                      {...props}
                      query={slashMenuQuery}
                    />
                  )}
                />
              </>
            )
            : null}
        </BlockNoteView>

        <style>{styles}</style>
      </div>
    );
  };
}
