const DEFAULT_BLOCKNOTE_CONTENT = [{ type: 'paragraph', content: [] }] as const;

export function normalizeBlockNoteContent(content: unknown[] | undefined): unknown[] {
  if (!Array.isArray(content) || content.length === 0) {
    return [...DEFAULT_BLOCKNOTE_CONTENT];
  }

  return content;
}
