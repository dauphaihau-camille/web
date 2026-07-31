import {
  act,
  fireEvent,
  renderHook,
  waitFor,
} from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { PluginKey } from 'prosemirror-state';
import * as Yjs from 'yjs';

import {
  type BodyUndoRedoBridge,
  DOCUMENT_LOCAL_EDIT_ORIGIN,
  useDocumentSessionUndoRedo,
} from './use-document-session-undo-redo';
import { SOCKET_COLLABORATION_ORIGIN } from './document-collaboration/document-collaboration.constants';

const {
  toastMock,
} = vi.hoisted(() => ({
  toastMock: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: toastMock,
}));

function createRef<T extends HTMLElement>(element: T) {
  return {
    current: element,
  };
}

function createTextBodyBridge(body: Yjs.Text, value: string): BodyUndoRedoBridge {
  return {
    redo: vi.fn(() => {
      body.delete(0, body.length);
      body.insert(0, value);
      return true;
    }),
    undo: vi.fn(() => {
      body.delete(0, body.length);
      return true;
    }),
  };
}

function createArchiveBodyBridge(body: Yjs.Text): BodyUndoRedoBridge {
  return {
    redo: vi.fn(() => {
      body.delete(0, body.length);
      return true;
    }),
    undo: vi.fn(() => {
      body.delete(0, body.length);
      body.insert(0, 'Subdoc');
      return true;
    }),
  };
}

function createDuplicateBodyBridge(body: Yjs.Text): BodyUndoRedoBridge {
  return {
    redo: vi.fn(() => {
      body.insert(0, 'Copy');
      return true;
    }),
    undo: vi.fn(() => {
      body.delete(0, body.length);
      return true;
    }),
  };
}

function renderUndoRedoHook({
  bodyEditor = document.createElement('div'),
  bodyUndoRedoBridge = null,
  document: collaborationDocument = new Yjs.Doc(),
  enabled = true,
  archiveRestoredSubdocument,
  restoreArchivedSubdocument,
  titleInput = document.createElement('textarea'),
}: {
  archiveRestoredSubdocument?: (subdocumentId: string) => Promise<void>;
  bodyEditor?: HTMLElement;
  bodyUndoRedoBridge?: BodyUndoRedoBridge | null;
  document?: Yjs.Doc;
  enabled?: boolean;
  restoreArchivedSubdocument?: (subdocumentId: string) => Promise<void>;
  titleInput?: HTMLTextAreaElement;
} = {}) {
  document.body.append(titleInput, bodyEditor);
  const bodyUndoRedoBridgeRef = {
    current: bodyUndoRedoBridge,
  };

  const result = renderHook(() => useDocumentSessionUndoRedo({
    archiveRestoredSubdocument,
    bodyUndoRedoBridgeRef,
    bodyEditorRef: createRef(bodyEditor),
    document: collaborationDocument,
    enabled,
    restoreArchivedSubdocument,
    titleInputRef: createRef(titleInput),
  }));

  return {
    ...result,
    bodyEditor,
    bodyUndoRedoBridgeRef,
    document: collaborationDocument,
    titleInput,
  };
}

describe('useDocumentSessionUndoRedo', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    toastMock.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('undoes and redoes local title edits from the title editing surface', async () => {
    const { document: collaborationDocument, titleInput } = renderUndoRedoHook();
    const meta = collaborationDocument.getMap('meta');

    act(() => {
      collaborationDocument.transact(() => {
        meta.set('title', 'Roadmap');
      }, DOCUMENT_LOCAL_EDIT_ORIGIN);
    });

    expect(meta.get('title')).toBe('Roadmap');

    fireEvent.keyDown(titleInput, {
      key: 'z',
      metaKey: true,
    });

    await waitFor(() => {
      expect(meta.get('title')).toBeUndefined();
    });

    fireEvent.keyDown(titleInput, {
      key: 'z',
      metaKey: true,
      shiftKey: true,
    });

    await waitFor(() => {
      expect(meta.get('title')).toBe('Roadmap');
    });
  });

  it('undoes and redoes normal body edits without calling the body bridge', async () => {
    const collaborationDocument = new Yjs.Doc();
    const body = collaborationDocument.getText('body-test');
    const bodyUndoRedoBridge = createTextBodyBridge(body, 'Body');
    const {
      bodyEditor,
    } = renderUndoRedoHook({
      bodyUndoRedoBridge,
      document: collaborationDocument,
    });

    act(() => {
      collaborationDocument.transact(() => {
        body.insert(0, 'Body');
      }, new PluginKey('y-sync'));
    });

    expect(body.toString()).toBe('Body');

    fireEvent.keyDown(bodyEditor, {
      key: 'z',
      metaKey: true,
    });

    await waitFor(() => {
      expect(body.toString()).toBe('');
    });
    expect(bodyUndoRedoBridge.undo).not.toHaveBeenCalled();

    fireEvent.keyDown(bodyEditor, {
      key: 'z',
      metaKey: true,
      shiftKey: true,
    });

    await waitFor(() => {
      expect(body.toString()).toBe('Body');
    });
    expect(bodyUndoRedoBridge.redo).not.toHaveBeenCalled();
  });

  it('does not intercept empty normal body undo history', async () => {
    const collaborationDocument = new Yjs.Doc();
    const body = collaborationDocument.getText('body-test');
    const bodyUndoRedoBridge = {
      redo: vi.fn(() => false),
      undo: vi.fn(() => false),
    };
    const {
      bodyEditor,
    } = renderUndoRedoHook({
      bodyUndoRedoBridge,
      document: collaborationDocument,
    });

    act(() => {
      collaborationDocument.transact(() => {
        body.insert(0, 'abc');
      }, SOCKET_COLLABORATION_ORIGIN);
    });

    fireEvent.keyDown(bodyEditor, {
      key: 'z',
      metaKey: true,
    });

    expect(bodyUndoRedoBridge.undo).not.toHaveBeenCalled();
    expect(body.toString()).toBe('abc');
  });

  it('prefers the create-subdocument anchor block when delegating body undo', async () => {
    const collaborationDocument = new Yjs.Doc();
    const body = collaborationDocument.getText('body-test');
    const bodyUndoRedoBridge = createTextBodyBridge(body, 'Subdoc');
    const {
      bodyEditor,
      result,
    } = renderUndoRedoHook({
      bodyUndoRedoBridge,
      document: collaborationDocument,
    });

    act(() => {
      result.current.registerCommandUndoMetadata({
        anchorBlockId: 'paragraph-1',
        type: 'createSubdocument',
      });
      collaborationDocument.transact(() => {
        body.insert(0, 'Subdoc');
      }, new PluginKey('y-sync'));
    });

    fireEvent.keyDown(bodyEditor, {
      key: 'z',
      metaKey: true,
    });

    await waitFor(() => {
      expect(body.toString()).toBe('');
    });
    expect(bodyUndoRedoBridge.undo).toHaveBeenCalledWith({
      preferredBlockId: 'paragraph-1',
    });
  });

  it('does not call the body bridge after undo from the title editing surface', async () => {
    const bodyUndoRedoBridge = {
      redo: vi.fn(() => true),
      undo: vi.fn(() => true),
    };
    const {
      document: collaborationDocument,
      titleInput,
    } = renderUndoRedoHook({
      bodyUndoRedoBridge,
    });
    const meta = collaborationDocument.getMap('meta');

    act(() => {
      collaborationDocument.transact(() => {
        meta.set('title', 'Roadmap');
      }, DOCUMENT_LOCAL_EDIT_ORIGIN);
    });

    fireEvent.keyDown(titleInput, {
      key: 'z',
      metaKey: true,
    });

    await waitFor(() => {
      expect(meta.get('title')).toBeUndefined();
    });
    expect(bodyUndoRedoBridge.undo).not.toHaveBeenCalled();
    expect(bodyUndoRedoBridge.redo).not.toHaveBeenCalled();
  });

  it('ignores remote updates and shortcuts outside editing surfaces', () => {
    const {
      document: collaborationDocument,
      titleInput,
    } = renderUndoRedoHook();
    const meta = collaborationDocument.getMap('meta');
    const unrelatedInput = document.createElement('input');
    document.body.append(unrelatedInput);

    act(() => {
      collaborationDocument.transact(() => {
        meta.set('title', 'Remote title');
      }, SOCKET_COLLABORATION_ORIGIN);
    });

    fireEvent.keyDown(titleInput, {
      key: 'z',
      metaKey: true,
    });

    expect(meta.get('title')).toBe('Remote title');

    act(() => {
      collaborationDocument.transact(() => {
        meta.set('title', 'Local title');
      }, DOCUMENT_LOCAL_EDIT_ORIGIN);
    });

    fireEvent.keyDown(unrelatedInput, {
      key: 'z',
      metaKey: true,
    });

    expect(meta.get('title')).toBe('Local title');
  });

  it('clears session history when editing becomes disabled', () => {
    const titleInput = document.createElement('textarea');
    const collaborationDocument = new Yjs.Doc();
    const meta = collaborationDocument.getMap('meta');
    const { rerender } = renderHook(
      ({ enabled }) => useDocumentSessionUndoRedo({
        bodyUndoRedoBridgeRef: {
          current: null,
        },
        bodyEditorRef: createRef(document.createElement('div')),
        document: collaborationDocument,
        enabled,
        titleInputRef: createRef(titleInput),
      }),
      {
        initialProps: {
          enabled: true,
        },
      },
    );

    act(() => {
      collaborationDocument.transact(() => {
        meta.set('title', 'Draft');
      }, DOCUMENT_LOCAL_EDIT_ORIGIN);
    });

    rerender({ enabled: false });
    rerender({ enabled: true });

    fireEvent.keyDown(titleInput, {
      key: 'z',
      metaKey: true,
    });

    expect(meta.get('title')).toBe('Draft');
  });

  it('runs archive compensation before undoing and redoing a subdoc placement effect', async () => {
    const collaborationDocument = new Yjs.Doc();
    const body = collaborationDocument.getText('body-test');

    act(() => {
      collaborationDocument.transact(() => {
        body.insert(0, 'Subdoc');
      }, SOCKET_COLLABORATION_ORIGIN);
    });

    const restoreArchivedSubdocument = vi.fn(async (subdocumentId: string) => {
      expect(subdocumentId).toBe('child-1');
      expect(body.toString()).toBe('');
    });
    const archiveRestoredSubdocument = vi.fn(async (subdocumentId: string) => {
      expect(subdocumentId).toBe('child-1');
      expect(body.toString()).toBe('Subdoc');
    });

    const {
      bodyEditor,
      result,
    } = renderUndoRedoHook({
      archiveRestoredSubdocument,
      bodyUndoRedoBridge: createArchiveBodyBridge(body),
      document: collaborationDocument,
      restoreArchivedSubdocument,
    });

    act(() => {
      result.current.registerCommandUndoMetadata({
        subdocumentId: 'child-1',
        type: 'archiveSubdocument',
      });
      collaborationDocument.transact(() => {
        body.delete(0, body.length);
      }, new PluginKey('y-sync'));
    });

    expect(body.toString()).toBe('');

    fireEvent.keyDown(bodyEditor, {
      key: 'z',
      metaKey: true,
    });

    await waitFor(() => {
      expect(body.toString()).toBe('Subdoc');
    });
    expect(restoreArchivedSubdocument).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(bodyEditor, {
      key: 'z',
      metaKey: true,
      shiftKey: true,
    });

    await waitFor(() => {
      expect(body.toString()).toBe('');
    });
    expect(archiveRestoredSubdocument).toHaveBeenCalledTimes(1);
  });

  it('archives duplicated subdoc before undoing placement and restores it before redo', async () => {
    const collaborationDocument = new Yjs.Doc();
    const body = collaborationDocument.getText('body-test');
    const archiveRestoredSubdocument = vi.fn(async (subdocumentId: string) => {
      expect(subdocumentId).toBe('child-copy-1');
      expect(body.toString()).toBe('Copy');
    });
    const restoreArchivedSubdocument = vi.fn(async (subdocumentId: string) => {
      expect(subdocumentId).toBe('child-copy-1');
      expect(body.toString()).toBe('');
    });

    const {
      bodyEditor,
      result,
    } = renderUndoRedoHook({
      archiveRestoredSubdocument,
      bodyUndoRedoBridge: createDuplicateBodyBridge(body),
      document: collaborationDocument,
      restoreArchivedSubdocument,
    });

    act(() => {
      result.current.registerCommandUndoMetadata({
        anchorBlockId: 'source-block-1',
        duplicatedSubdocumentId: 'child-copy-1',
        sourceSubdocumentId: 'child-1',
        type: 'duplicateSubdocument',
      });
      collaborationDocument.transact(() => {
        body.insert(0, 'Copy');
      }, new PluginKey('y-sync'));
    });

    expect(body.toString()).toBe('Copy');

    fireEvent.keyDown(bodyEditor, {
      key: 'z',
      metaKey: true,
    });

    await waitFor(() => {
      expect(body.toString()).toBe('');
    });
    expect(archiveRestoredSubdocument).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(bodyEditor, {
      key: 'z',
      metaKey: true,
      shiftKey: true,
    });

    await waitFor(() => {
      expect(body.toString()).toBe('Copy');
    });
    expect(restoreArchivedSubdocument).toHaveBeenCalledTimes(1);
  });

  it('keeps archive command metadata until the delayed placement removal is captured', async () => {
    const collaborationDocument = new Yjs.Doc();
    const body = collaborationDocument.getText('body-test');

    act(() => {
      collaborationDocument.transact(() => {
        body.insert(0, 'Subdoc');
      }, SOCKET_COLLABORATION_ORIGIN);
    });

    const restoreArchivedSubdocument = vi.fn(async () => {
      expect(body.toString()).toBe('');
    });

    const {
      bodyEditor,
      result,
    } = renderUndoRedoHook({
      bodyUndoRedoBridge: createArchiveBodyBridge(body),
      document: collaborationDocument,
      restoreArchivedSubdocument,
    });

    act(() => {
      result.current.registerCommandUndoMetadata({
        subdocumentId: 'child-1',
        type: 'archiveSubdocument',
      });
    });

    await new Promise((resolve) => {
      window.setTimeout(resolve, 0);
    });

    act(() => {
      collaborationDocument.transact(() => {
        body.delete(0, body.length);
      }, new PluginKey('y-sync'));
    });

    fireEvent.keyDown(bodyEditor, {
      key: 'z',
      metaKey: true,
    });

    await waitFor(() => {
      expect(body.toString()).toBe('Subdoc');
    });
    expect(restoreArchivedSubdocument).toHaveBeenCalledTimes(1);
  });

  it('runs archive compensation when undo focus is outside the editor after a menu command', async () => {
    const collaborationDocument = new Yjs.Doc();
    const body = collaborationDocument.getText('body-test');
    const menuButton = document.createElement('button');
    document.body.append(menuButton);

    act(() => {
      collaborationDocument.transact(() => {
        body.insert(0, 'Subdoc');
      }, SOCKET_COLLABORATION_ORIGIN);
    });

    const restoreArchivedSubdocument = vi.fn(async () => {
      expect(body.toString()).toBe('');
    });

    const { result } = renderUndoRedoHook({
      document: collaborationDocument,
      restoreArchivedSubdocument,
    });

    act(() => {
      result.current.registerCommandUndoMetadata({
        subdocumentId: 'child-1',
        type: 'archiveSubdocument',
      });
      collaborationDocument.transact(() => {
        body.delete(0, body.length);
      }, new PluginKey('y-sync'));
    });

    fireEvent.keyDown(menuButton, {
      key: 'z',
      metaKey: true,
    });

    await waitFor(() => {
      expect(body.toString()).toBe('Subdoc');
    });
    expect(restoreArchivedSubdocument).toHaveBeenCalledTimes(1);
  });

  it('captures command placement changes even when BlockNote uses an unrecognized local origin', async () => {
    const collaborationDocument = new Yjs.Doc();
    const body = collaborationDocument.getText('body-test');
    const blockNoteCommandOrigin = { source: 'blocknote-command' };

    act(() => {
      collaborationDocument.transact(() => {
        body.insert(0, 'Subdoc');
      }, SOCKET_COLLABORATION_ORIGIN);
    });

    const restoreArchivedSubdocument = vi.fn(async () => {
      expect(body.toString()).toBe('');
    });

    const {
      bodyEditor,
      result,
    } = renderUndoRedoHook({
      bodyUndoRedoBridge: createArchiveBodyBridge(body),
      document: collaborationDocument,
      restoreArchivedSubdocument,
    });

    act(() => {
      result.current.registerCommandUndoMetadata({
        subdocumentId: 'child-1',
        type: 'archiveSubdocument',
      });
      collaborationDocument.transact(() => {
        body.delete(0, body.length);
      }, blockNoteCommandOrigin);
    });

    fireEvent.keyDown(bodyEditor, {
      key: 'z',
      metaKey: true,
    });

    await waitFor(() => {
      expect(body.toString()).toBe('Subdoc');
    });
    expect(restoreArchivedSubdocument).toHaveBeenCalledTimes(1);
  });

  it('does not replay archive placement undo when compensation fails', async () => {
    const collaborationDocument = new Yjs.Doc();
    const body = collaborationDocument.getText('body-test');

    act(() => {
      collaborationDocument.transact(() => {
        body.insert(0, 'Subdoc');
      }, SOCKET_COLLABORATION_ORIGIN);
    });

    const bodyUndoRedoBridge = createArchiveBodyBridge(body);
    const {
      bodyEditor,
      result,
    } = renderUndoRedoHook({
      bodyUndoRedoBridge,
      document: collaborationDocument,
      restoreArchivedSubdocument: vi.fn().mockRejectedValue(new Error('restore failed')),
    });

    act(() => {
      result.current.registerCommandUndoMetadata({
        subdocumentId: 'child-1',
        type: 'archiveSubdocument',
      });
      collaborationDocument.transact(() => {
        body.delete(0, body.length);
      }, new PluginKey('y-sync'));
    });

    fireEvent.keyDown(bodyEditor, {
      key: 'z',
      metaKey: true,
    });

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Could not complete undo');
    });
    expect(body.toString()).toBe('');
    expect(bodyUndoRedoBridge.undo).not.toHaveBeenCalled();
  });
});
