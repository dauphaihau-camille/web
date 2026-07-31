import { cn } from '../../../lib/utils';

export const blockNoteViewClassName = cn(
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
