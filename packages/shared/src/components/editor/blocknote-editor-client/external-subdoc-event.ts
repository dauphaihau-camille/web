import { isEmptyParagraphBlock } from '../blocknote-content-utils';
import { hasMeaningfulContent } from '../has-meaningful-content';
import type { BlockNoteClientEditor } from './create-blocknote-editor-client.types';

type ExternalSubdocCreatedDetail = {
  childDocument?: {
    content?: unknown[];
    id?: unknown;
    public_id?: unknown;
    title?: unknown;
  };
  parentDocumentId?: unknown;
  workspaceSlug?: unknown;
};

export function handleExternalSubdocCreatedEvent({
  documentId,
  editor,
  event,
  workspaceSlug,
}: {
  documentId: string;
  editor: BlockNoteClientEditor;
  event: Event;
  workspaceSlug: string;
}) {
  const detail = (event as CustomEvent<ExternalSubdocCreatedDetail>).detail;

  if (
    !detail
    || detail.parentDocumentId !== documentId
    || !detail.childDocument
    || typeof detail.childDocument.id !== 'string'
    || typeof detail.childDocument.public_id !== 'string'
  ) {
    return;
  }

  const currentDocument = editor.document as unknown[];

  if (documentHasSubdocReference(currentDocument, detail.childDocument.id)) {
    return;
  }

  const childTitle =
    typeof detail.childDocument.title === 'string'
      ? detail.childDocument.title
      : 'Untitled';
  const createdSubdocBlock = {
    type: 'subdoc' as const,
    props: {
      documentId: detail.childDocument.id,
      publicId: detail.childDocument.public_id,
      workspaceId: typeof detail.workspaceSlug === 'string'
        ? detail.workspaceSlug
        : workspaceSlug,
      title: childTitle || 'Untitled',
      hasContent: hasMeaningfulContent(detail.childDocument.content),
    },
  };
  const lastBlock = editor.document.at(-1) as
    | { type?: unknown; content?: unknown; children?: unknown }
    | undefined;

  editor.transact(() => {
    if (lastBlock && isEmptyParagraphBlock(lastBlock)) {
      editor.updateBlock(lastBlock as never, createdSubdocBlock as never);
      return;
    }

    if (lastBlock) {
      editor.insertBlocks(
        [createdSubdocBlock] as never[],
        lastBlock as never,
        'after',
      );
      return;
    }

    editor.replaceBlocks(editor.document, [createdSubdocBlock] as never[]);
  });
}

function documentHasSubdocReference(
  blocks: unknown[],
  childDocumentId: string,
): boolean {
  return blocks.some((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    const block = value as {
      type?: unknown;
      props?: unknown;
      children?: unknown;
    };

    if (
      block.type === 'subdoc'
      && block.props
      && typeof block.props === 'object'
      && !Array.isArray(block.props)
      && (block.props as { documentId?: unknown }).documentId === childDocumentId
    ) {
      return true;
    }

    return Array.isArray(block.children)
      ? documentHasSubdocReference(block.children, childDocumentId)
      : false;
  });
}
