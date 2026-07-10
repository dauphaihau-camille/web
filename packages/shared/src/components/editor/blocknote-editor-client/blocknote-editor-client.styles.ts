export const blockNoteEditorClientBaseStyles = `
  .editor-blocknote-client .bn-editor,
  .editor-blocknote-client .tiptap {
    background-color: transparent !important;
  }

  .editor-blocknote-client .bn-block-group,
  .editor-blocknote-client .bn-block-outer {
    background-color: transparent !important;
  }

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

  .editor-blocknote-client [data-test="createLink"] {
    display: none !important;
  }
`;
