import { createExtension, createStore } from '@blocknote/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

const dragHandleMenuSelectionPluginKey = new PluginKey(
  'drag-handle-menu-selection',
);

export const dragHandleMenuSelectionExtension = createExtension(({ editor }) => {
  const store = createStore(
    { blockId: null as string | null },
    {
      onUpdate() {
        editor.transact((transaction) =>
          transaction.setMeta(dragHandleMenuSelectionPluginKey, {}),
        );
      },
    },
  );

  return {
    key: 'dragHandleMenuSelection',
    store,
    prosemirrorPlugins: [
      new Plugin({
        key: dragHandleMenuSelectionPluginKey,
        props: {
          decorations: (state) => {
            if (!store.state.blockId) {
              return DecorationSet.empty;
            }

            let blockContentDecoration: Decoration | undefined;

            state.doc.descendants((node, position) => {
              if (
                blockContentDecoration
                || node.type.name !== 'blockContainer'
                || String(node.attrs.id) !== store.state.blockId
              ) {
                return !blockContentDecoration;
              }

              const blockContent = node.firstChild;

              if (!blockContent) {
                return false;
              }

              const blockContentPosition = position + 1;
              blockContentDecoration = Decoration.node(
                blockContentPosition,
                blockContentPosition + blockContent.nodeSize,
                { 'data-drag-handle-menu-open': 'true' },
              );

              return false;
            });

            return blockContentDecoration
              ? DecorationSet.create(state.doc, [blockContentDecoration])
              : DecorationSet.empty;
          },
        },
      }),
    ],
    setSelectedBlock(blockId: string | null) {
      if (store.state.blockId === blockId) {
        return;
      }

      store.setState({ blockId });
    },
  } as const;
});
