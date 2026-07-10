'use client';

import { editorHasBlockWithType, type Block } from '@blocknote/core';
import {
  blockTypeSelectItems,
  useBlockNoteEditor,
  useComponentsContext,
  useDictionary,
  useEditorState,
} from '@blocknote/react';
import { ArrowRightLeftIcon, CheckIcon } from 'lucide-react';

import type { EditorBlock } from './editor-block';

export function TurnToItem() {
  const Components = useComponentsContext();
  const editor = useBlockNoteEditor();
  const dictionary = useDictionary();
  const selectedBlocks = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) =>
      currentEditor.getSelection()?.blocks ?? [currentEditor.getTextCursorPosition().block],
  });

  if (!Components || !editor.isEditable || selectedBlocks.length === 0) {
    return null;
  }

  const firstSelectedBlock = selectedBlocks[0] as EditorBlock;
  const supportedItems = blockTypeSelectItems(dictionary).filter((item) =>
    editorHasBlockWithType(
      editor,
      item.type,
      Object.fromEntries(
        Object.entries(item.props ?? {}).map(([propName, propValue]) => [
          propName,
          typeof propValue,
        ]),
      ) as Record<string, 'string' | 'number' | 'boolean'>,
    ),
  );

  if (supportedItems.length === 0) {
    return null;
  }

  return (
    <Components.Generic.Menu.Root position="right" sub={true}>
      <Components.Generic.Menu.Trigger sub={true}>
        <Components.Generic.Menu.Item
          className="bn-menu-item drag-handle-menu__item"
          subTrigger={true}
        >
          <div className="flex w-full items-center gap-2">
            <div className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
              <ArrowRightLeftIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1 truncate font-medium">Turn to</div>
          </div>
        </Components.Generic.Menu.Item>
      </Components.Generic.Menu.Trigger>

      <Components.Generic.Menu.Dropdown
        sub={true}
        className="bn-menu-dropdown drag-handle-submenu"
      >
        {supportedItems.map((item) => {
          const Icon = item.icon;
          const isSelected = item.type === firstSelectedBlock.type
            && Object.entries(item.props ?? {}).every(
              ([propName, propValue]) => firstSelectedBlock.props[propName] === propValue,
            );

          return (
            <Components.Generic.Menu.Item
              key={`${item.type}-${JSON.stringify(item.props ?? {})}`}
              className="bn-menu-item drag-handle-menu__item"
              icon={<Icon size={16} />}
              onClick={() => {
                editor.focus();
                editor.transact(() => {
                  for (const block of selectedBlocks as Block[]) {
                    editor.updateBlock(block, {
                      type: item.type as never,
                      props: item.props as never,
                    });
                  }
                });
              }}
            >
              <div className="flex w-full items-center gap-2">
                <div className="min-w-0 flex-1 truncate">{item.name}</div>
                {isSelected
                  ? <CheckIcon className="size-4 shrink-0 text-muted-foreground" />
                  : null}
              </div>
            </Components.Generic.Menu.Item>
          );
        })}
      </Components.Generic.Menu.Dropdown>
    </Components.Generic.Menu.Root>
  );
}
