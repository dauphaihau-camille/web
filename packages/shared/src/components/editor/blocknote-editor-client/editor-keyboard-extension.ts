import { createExtension } from '@blocknote/core';

export const editorKeyboardExtension = createExtension({
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
