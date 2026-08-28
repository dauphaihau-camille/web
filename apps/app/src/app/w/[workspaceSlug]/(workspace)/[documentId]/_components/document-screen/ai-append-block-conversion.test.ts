import { describe, expect, it } from 'vitest';

import { convertAiAppendResponseToBlocks } from './ai-append-block-conversion';

describe('convertAiAppendResponseToBlocks', () => {
  it('converts Markdown-lite assistant text into basic document blocks', () => {
    expect(convertAiAppendResponseToBlocks([
      '# Weekly plan',
      '',
      'Ship the AI append action.',
      '',
      '- Preserve bullets',
      '- Keep unsupported syntax as text',
      '',
      '1. Write test',
      '2. Implement feature',
    ].join('\n'))).toEqual([
      {
        type: 'heading',
        props: { level: 1 },
        content: [{ type: 'text', text: 'Weekly plan' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Ship the AI append action.' }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: 'Preserve bullets' }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: 'Keep unsupported syntax as text' }],
      },
      {
        type: 'numberedListItem',
        content: [{ type: 'text', text: 'Write test' }],
      },
      {
        type: 'numberedListItem',
        content: [{ type: 'text', text: 'Implement feature' }],
      },
    ]);
  });

  it('falls back to one empty paragraph when assistant text has no meaningful content', () => {
    expect(convertAiAppendResponseToBlocks('   \n\n')).toEqual([
      { type: 'paragraph', content: [] },
    ]);
  });
});
