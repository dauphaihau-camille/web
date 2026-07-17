import { QueryClient } from '@tanstack/react-query';

import type { Document } from '@/domains/document';
import { documentKeys } from '@/domains/document';

import {
  insertCreatedPrivateRootDocument,
  updateCachedReferencedSubdocTitles,
} from './document-query-cache';

const childDocument: Document = {
  id: 'child-1',
  public_id: 'child-public-1',
  version: 2,
  workspace_id: 'acme',
  teamspace_id: undefined,
  parent_document_id: 'parent-1',
  title: 'Account Health Review',
  content_format: 'blocknote_v1',
  content: [],
  sort_key: 1,
  archived_at: undefined,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const parentDocument: Document = {
  id: 'parent-1',
  public_id: 'parent-public-1',
  version: 7,
  workspace_id: 'acme',
  teamspace_id: undefined,
  parent_document_id: undefined,
  title: 'Operations Home',
  content_format: 'blocknote_v1',
  content: [
    {
      id: 'subdoc-block',
      type: 'subdoc',
      props: {
        documentId: 'child-1',
        title: 'Account Health Review',
      },
      children: [],
    },
  ],
  sort_key: 2,
  archived_at: undefined,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('updateCachedReferencedSubdocTitles', () => {
  it('updates loaded parent documents and returns the changed documents', () => {
    const queryClient = new QueryClient();

    queryClient.setQueryData(documentKeys.detail(childDocument.id), childDocument);
    queryClient.setQueryData(documentKeys.detail(parentDocument.id), parentDocument);

    const updatedReferencedDocuments = updateCachedReferencedSubdocTitles(
      queryClient,
      childDocument.id,
      'Account Health Revieww',
    );

    expect(updatedReferencedDocuments).toEqual([
      {
        documentId: parentDocument.id,
        version: parentDocument.version,
        content: [
          {
            id: 'subdoc-block',
            type: 'subdoc',
            props: {
              documentId: 'child-1',
              title: 'Account Health Revieww',
            },
            children: [],
          },
        ],
      },
    ]);

    expect(queryClient.getQueryData(documentKeys.detail(parentDocument.id))).toMatchObject({
      content: [
        {
          props: {
            documentId: 'child-1',
            title: 'Account Health Revieww',
          },
        },
      ],
    });
  });
});

describe('insertCreatedPrivateRootDocument', () => {
  it('inserts into the unfiltered private root navigation cache', () => {
    const queryClient = new QueryClient();
    const rootQueryKey = documentKeys.rootList('acme', 50);

    queryClient.setQueryData(
      rootQueryKey,
      {
        private_documents: {
          items: [],
        },
        teamspaces: [],
      },
    );

    insertCreatedPrivateRootDocument(queryClient, 'acme', parentDocument);

    expect(
      queryClient.getQueryData(rootQueryKey),
    ).toMatchObject({
      private_documents: {
        items: [
          {
            id: parentDocument.id,
            public_id: parentDocument.public_id,
            title: parentDocument.title,
            has_content: true,
          },
        ],
      },
    });
  });
});
