import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  DocumentNavigationNode,
  WorkspaceDocumentNavigation,
} from '@/domains/document';

vi.mock('@/domains/document', () => ({
  documentDetailQueryOptions: vi.fn(),
  workspaceDocumentChildrenQueryOptions: vi.fn(),
  workspaceDocumentRootQueryOptions: vi.fn(),
}));

import {
  getNearestDocument,
  getRootNavigationItems,
} from './document-tree-node-action-helpers';

const privateDocumentA: DocumentNavigationNode = {
  id: 'private-a',
  public_id: 'private-a',
  title: 'Private A',
  teamspace_id: undefined,
  parent_document_id: undefined,
  sort_key: 10,
  has_children: false,
  has_content: true,
  is_favorite: false,
};

const privateDocumentB: DocumentNavigationNode = {
  id: 'private-b',
  public_id: 'private-b',
  title: 'Private B',
  teamspace_id: undefined,
  parent_document_id: undefined,
  sort_key: 20,
  has_children: false,
  has_content: true,
  is_favorite: false,
};

const teamspaceDocument: DocumentNavigationNode = {
  id: 'team-a',
  public_id: 'team-a',
  title: 'Team A',
  teamspace_id: 'team-1',
  parent_document_id: undefined,
  sort_key: 5,
  has_children: false,
  has_content: true,
  is_favorite: false,
};

describe('document tree node action helpers', () => {
  it('returns the nearest sibling from sort order around the current document', () => {
    expect(
      getNearestDocument(
        [privateDocumentA, privateDocumentB, teamspaceDocument],
        'private-a',
      ),
    ).toEqual(privateDocumentB);
  });

  it('falls back to the first sorted item when the current document is missing', () => {
    expect(
      getNearestDocument([privateDocumentA, privateDocumentB], 'missing'),
    ).toEqual(privateDocumentB);
  });

  it('returns private root items when no teamspace is selected', () => {
    const navigation = createNavigation();

    expect(getRootNavigationItems(navigation)).toEqual([
      privateDocumentA,
      privateDocumentB,
    ]);
  });

  it('returns teamspace root items for the active teamspace', () => {
    const navigation = createNavigation();

    expect(getRootNavigationItems(navigation, 'team-1')).toEqual([
      teamspaceDocument,
    ]);
  });
});

function createNavigation(): WorkspaceDocumentNavigation {
  return {
    private_documents: {
      items: [privateDocumentA, privateDocumentB],
      next_cursor: undefined,
    },
    teamspaces: [
      {
        id: 'team-1',
        documents: {
          items: [teamspaceDocument],
          next_cursor: undefined,
        },
      },
    ],
  } as WorkspaceDocumentNavigation;
}
