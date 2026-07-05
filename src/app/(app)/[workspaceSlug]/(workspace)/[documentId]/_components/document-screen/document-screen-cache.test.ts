import { QueryClient } from '@tanstack/react-query';

import type { Document } from '@/domains/document';
import { documentKeys } from '@/domains/document';

import { updateCachedReferencedSubdocTitles } from './document-screen-cache';

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
      id: 'subpage-block',
      type: 'subpage',
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
            id: 'subpage-block',
            type: 'subpage',
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
