import { isEmptyParagraphBlock } from '@shared/components/editor/blocknote-content-utils';

const DEFAULT_BLOCKNOTE_CONTENT = [{ type: 'paragraph', content: [] }] as const;

export function normalizeBlockNoteContent(content: unknown[] | undefined): unknown[] {
  if (!Array.isArray(content) || content.length === 0) {
    return [...DEFAULT_BLOCKNOTE_CONTENT];
  }

  if (content.length === 1 || !isEmptyParagraphBlock(content[0])) {
    return content;
  }

  const normalizedContent = content.slice(1);

  return normalizedContent.length > 0
    ? normalizedContent
    : [...DEFAULT_BLOCKNOTE_CONTENT];
}
