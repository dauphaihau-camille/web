import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

import type { Document } from '@/domains/document';
import { renderWithProviders } from '@shared/test/render';

import { DocumentToolbar } from './document-toolbar';

vi.mock('./collaborator-avatar-group', () => ({
  CollaboratorAvatarGroup: () => (
    <div data-testid="collaborator-avatar-group" />
  ),
}));

vi.mock('./doc-operations/doc-operations', () => ({
  DocOperations: () => <div data-testid="doc-operations" />,
}));

vi.mock('./doc-operations/relative-time-text', () => ({
  RelativeTimeText: () => <span>Edited recently</span>,
}));

vi.mock('./share-button/share-button', () => ({
  ShareButton: () => <button type="button">Share</button>,
}));

const documentFixture: Document = {
  id: 'doc-1',
  public_id: 'public-doc-1',
  version: 1,
  workspace_id: 'workspace-1',
  owner_user_id: 'user-1',
  owner_user: {
    id: 'user-1',
    email: 'owner@example.com',
    display_name: 'Owner',
  },
  teamspace_id: undefined,
  parent_document_id: undefined,
  title: 'Quarterly plan',
  content_format: 'blocknote_v1',
  content: [],
  sort_key: 10,
  archived_at: undefined,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  access: {
    scope: 'private',
    permission: 'manage',
    can_view: true,
    can_edit: true,
    can_manage: true,
  },
  collaboration: {
    enabled: false,
    mode: 'edit',
    show_presence: false,
  },
};

function renderDocumentToolbar(
  props?: Partial<ComponentProps<typeof DocumentToolbar>>,
) {
  return renderWithProviders(
    <DocumentToolbar
      archiveCurrentDocument={vi.fn()}
      canManageAccess
      canEdit
      copyLink={vi.fn()}
      copyPublishedLink={vi.fn()}
      document={documentFixture}
      duplicateDocument={vi.fn()}
      favoriteStatus={{ is_favorite: false }}
      isArchiving={false}
      isDuplicating={false}
      isFavoriting={false}
      isPublishing={false}
      isUnpublishing={false}
      publishCurrentDocument={vi.fn()}
      restoreCurrentDocument={vi.fn()}
      showCollaborators={false}
      toggleFavorite={vi.fn()}
      unpublishCurrentDocument={vi.fn()}
      updatedAt={documentFixture.updated_at}
      workspaceSlug="acme"
      {...props}
    />,
  );
}

describe('DocumentToolbar', () => {
  it('hides collaborators when active collaboration is below the display threshold', () => {
    renderDocumentToolbar();

    expect(screen.queryByTestId('collaborator-avatar-group')).not.toBeInTheDocument();
  });

  it('shows collaborators when active collaboration reaches the display threshold', () => {
    renderDocumentToolbar({
      showCollaborators: true,
    });

    expect(screen.getByTestId('collaborator-avatar-group')).toBeInTheDocument();
  });
});
