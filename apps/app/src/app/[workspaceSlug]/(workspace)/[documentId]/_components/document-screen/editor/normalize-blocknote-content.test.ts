import { describe, expect, it } from 'vitest';

import { normalizeBlockNoteContent } from './normalize-blocknote-content';

describe('normalizeBlockNoteContent', () => {
  it('keeps the default empty paragraph for empty content', () => {
    expect(normalizeBlockNoteContent([])).toEqual([
      { type: 'paragraph', content: [] },
    ]);
  });

  it('drops a leading empty paragraph when meaningful content follows', () => {
    expect(normalizeBlockNoteContent([
      { type: 'paragraph', content: [] },
      {
        id: 'subdoc-1',
        type: 'subdoc',
        props: {
          documentId: 'doc-1',
        },
      },
    ])).toEqual([
      {
        id: 'subdoc-1',
        type: 'subdoc',
        props: {
          documentId: 'doc-1',
        },
      },
    ]);
  });
});
