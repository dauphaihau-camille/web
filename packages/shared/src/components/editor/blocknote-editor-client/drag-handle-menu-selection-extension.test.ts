/**
 * @vitest-environment jsdom
 */

import { createElement } from 'react';
import {
  BlockNoteEditor,
  BlockNoteSchema,
  defaultBlockSpecs,
} from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';

import { dragHandleMenuSelectionExtension } from './drag-handle-menu-selection-extension';

let editor: BlockNoteEditor | undefined;

afterEach(() => {
  editor?.unmount();
  editor = undefined;
});

describe('dragHandleMenuSelectionExtension', () => {
  it('decorates only the active block while the menu is open', () => {
    editor = BlockNoteEditor.create({
      initialContent: [
        { id: 'target-block', type: 'paragraph', content: 'Target' },
        { id: 'other-block', type: 'paragraph', content: 'Other' },
      ],
      extensions: [dragHandleMenuSelectionExtension()],
    });
    editor.mount(document.createElement('div'));

    const selectionExtension = editor.getExtension(
      dragHandleMenuSelectionExtension,
    );

    selectionExtension?.setSelectedBlock('target-block');

    const decoratedContent = editor.domElement?.querySelector(
      '.bn-block-content[data-drag-handle-menu-open]',
    );

    const decoratedBlock = decoratedContent?.closest('.bn-block') as
      | HTMLElement
      | null;

    expect(decoratedBlock?.dataset.id).toBe('target-block');

    selectionExtension?.setSelectedBlock(null);

    expect(
      editor.domElement?.querySelector(
        '.bn-block-content[data-drag-handle-menu-open]',
      ),
    ).toBeNull();
  });

  it('decorates the React node-view wrapper for a subdoc block', () => {
    const subdoc = createReactBlockSpec(
      {
        type: 'subdoc',
        propSchema: {},
        content: 'none',
      },
      {
        render: () => createElement('button', null, 'Untitled'),
      },
    );
    const schema = BlockNoteSchema.create({
      blockSpecs: {
        ...defaultBlockSpecs,
        subdoc: subdoc(),
      },
    });
    const subdocEditor = BlockNoteEditor.create({
      schema,
      initialContent: [
        { id: 'subdoc-block', type: 'subdoc' },
      ],
      extensions: [dragHandleMenuSelectionExtension()],
    });
    subdocEditor.mount(document.createElement('div'));

    const selectionExtension = subdocEditor.getExtension(
      dragHandleMenuSelectionExtension,
    );

    selectionExtension?.setSelectedBlock('subdoc-block');

    const decoratedRenderer = subdocEditor.domElement?.querySelector(
      '.bn-react-node-view-renderer[data-drag-handle-menu-open]',
    );

    expect(
      decoratedRenderer?.querySelector(
        '.bn-block-content[data-content-type="subdoc"]',
      ),
    ).not.toBeNull();

    subdocEditor.unmount();
  });
});
