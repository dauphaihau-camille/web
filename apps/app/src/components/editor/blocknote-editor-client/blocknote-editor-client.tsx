'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  filterSuggestionItems,
} from '@blocknote/core/extensions';
import {
  createExtension,
  type Block,
} from '@blocknote/core';
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

import { normalizeBlockNoteContent } from '@/components/editor/normalize-blocknote-content';
import { cn } from '@shared/lib/utils';

import { blockNoteSchema } from '../blocknote-schema';
import { blockNoteEditorClientStyles } from './blocknote-editor-client.styles';
import { EditorSideMenu } from './side-menu';
import { SlashMenu } from './slash-menu';

const HIDDEN_SLASH_MENU_TITLES = new Set([
  'Image',
  'Video',
  'Audio',
  'File',
]);

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
  const isSlashMenuOpenRef = useRef(false);
  const isSelectingSlashMenuItemRef = useRef(false);
  const isExecutingSlashCommandRef = useRef(false);
  const pendingSlashMenuSaveRef = useRef<unknown[] | null>(null);
  const { resolvedTheme } = useTheme();
  const normalizedContent = normalizeBlockNoteContent(content);

  const editor = useCreateBlockNote({
    schema: blockNoteSchema,
    initialContent: normalizedContent as never[],
    extensions: [editorKeyboardExtension],
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

    lastSerializedContentRef.current = nextSerializedContent;
    editor.replaceBlocks(editor.document, normalizedContent as never[]);
  }, [normalizedContent, editor]);

  useEffect(() => {
    return () => {
      cancelScheduledSave();
    };
  }, [cancelScheduledSave]);

  const flushPendingSlashMenuSave = () => {
    if (
      isSelectingSlashMenuItemRef.current
      || isExecutingSlashCommandRef.current
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

  const getInlineText = (value: unknown) => {
    if (!Array.isArray(value) || value.length === 0) {
      return '';
    }

    return value.map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return '';
      }

      const text = (item as { text?: unknown }).text;
      return typeof text === 'string' ? text : '';
    }).join('');
  };

  const shouldReplaceSlashAnchorBlock = (
    block: Block,
    slashCommandText: string,
  ) => {
    if (block.type !== 'paragraph') {
      return false;
    }

    const inlineText = getInlineText((block as { content?: unknown }).content).trim();
    const hasChildren = Array.isArray(block.children) && block.children.length > 0;

    if (hasChildren) {
      return false;
    }

    if (inlineText === slashCommandText.trim()) {
      return true;
    }

    return inlineText.length === 0;
  };

  const getSlashMenuItems = async (query: string) => {
    setSlashMenuQuery(query);

    const defaultItems = getDefaultReactSlashMenuItems(editor).filter(
      (item) => !HIDDEN_SLASH_MENU_TITLES.has(item.title),
    );

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
        const anchorBlock = editor.getTextCursorPosition().block as Block;
        const anchorBlockId = anchorBlock.id;
        const slashCommandText = `/${slashMenuQuery.trim()}`;
        const previousContent = JSON.parse(
          JSON.stringify(editor.document as unknown[]),
        ) as unknown[];
        const optimisticSubdocBlock = {
          type: 'subpage' as const,
          props: {
            documentId: `pending-${anchorBlockId}`,
            publicId: '',
            workspaceId: workspaceSlug,
            title: 'Untitled',
            hasContent: false,
          },
        };

        isExecutingSlashCommandRef.current = true;
        pendingSlashMenuSaveRef.current = null;
        cancelScheduledSave();
        setIsSaving(false);

        editor.focus();
        editor.transact(() => {
          if (shouldReplaceSlashAnchorBlock(anchorBlock, slashCommandText)) {
            editor.updateBlock(anchorBlock, optimisticSubdocBlock as never);
            return;
          }

          editor.insertBlocks(
            [optimisticSubdocBlock] as never[],
            anchorBlock,
            'after',
          );
        });

        void createSubdoc({
          anchorBlockId,
          slashCommandText,
          content: previousContent,
        })
          .catch(() => {
            lastSerializedContentRef.current = JSON.stringify(previousContent);
            editor.replaceBlocks(editor.document, previousContent as never[]);
          })
          .finally(() => {
            isExecutingSlashCommandRef.current = false;
            isSelectingSlashMenuItemRef.current = false;
            pendingSlashMenuSaveRef.current = null;
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

          if (isExecutingSlashCommandRef.current) {
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

      <style>{blockNoteEditorClientStyles}</style>
    </div>
  );
}
