import { blockNoteEditorClientBaseStyles } from '@shared/components/editor/blocknote-editor-client/blocknote-editor-client.styles';

export const blockNoteEditorClientStyles = `
${blockNoteEditorClientBaseStyles}

  .editor-blocknote-client .bn-formatting-toolbar:empty {
    display: none !important;
  }

  .editor-blocknote-client [data-floating-ui-focusable]:has(> .bn-formatting-toolbar:empty) {
    display: none !important;
  }
`;
