import { blockNoteEditorClientBaseStyles } from '@shared/components/editor/blocknote-editor-client/blocknote-editor-client.styles';

export const blockNoteEditorClientStyles = `
${blockNoteEditorClientBaseStyles}

  .editor-blocknote-client .bn-block-content[data-content-type="bulletListItem"]::before,
  .editor-blocknote-client .bn-block-content[data-content-type="numberedListItem"]::before {
    min-width: 0.875rem;
    padding-right: 0;
    padding-left: 0.9rem;
  }

  .editor-blocknote-client
    .bn-block-content:is([data-content-type="bulletListItem"], [data-content-type="numberedListItem"])
    > .bn-inline-content {
    padding-left: 0.5rem;
  }

  .editor-blocknote-client
    .bn-block-group
    .bn-block:not(:has(.bn-toggle-wrapper))
    .bn-block-group
    .bn-block-outer:not([data-prev-depth-changed])::before {
    border-left: 0 !important;
  }

  .editor-blocknote-client .bn-formatting-toolbar:empty {
    display: none !important;
  }

  .editor-blocknote-client [data-floating-ui-focusable]:has(> .bn-formatting-toolbar:empty) {
    display: none !important;
  }
`;
