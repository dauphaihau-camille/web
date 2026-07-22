'use client';

export const DOCUMENT_SUBDOC_CREATED_EVENT = 'camille:document-subdoc-created';

export type DocumentSubdocCreatedEventDetail = {
  parentDocumentId: string;
  workspaceSlug: string;
  childDocument: {
    id: string;
    public_id: string;
    title: string;
    content: unknown[];
  };
};

export function dispatchDocumentSubdocCreatedEvent(
  detail: DocumentSubdocCreatedEventDetail,
) {
  window.dispatchEvent(new CustomEvent(DOCUMENT_SUBDOC_CREATED_EVENT, {
    detail,
  }));
}
