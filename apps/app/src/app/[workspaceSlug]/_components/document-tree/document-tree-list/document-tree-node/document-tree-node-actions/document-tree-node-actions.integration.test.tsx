import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { DocumentNavigationNode } from '@/domains/document';
import { TooltipProvider } from '@shared/components/ui/tooltip';

import { DocumentTreeNodeActions } from './document-tree-node-actions';

const { useDocumentTreeNodeActionsMock } = vi.hoisted(() => ({
  useDocumentTreeNodeActionsMock: vi.fn(),
}));

vi.mock('./use-document-tree-node-actions', () => ({
  useDocumentTreeNodeActions: useDocumentTreeNodeActionsMock,
}));

const documentFixture: DocumentNavigationNode = {
  id: 'doc-1',
  public_id: 'public-doc-1',
  title: 'Architecture Decisions',
  teamspace_id: 'teamspace-1',
  parent_document_id: undefined,
  sort_key: 10,
  has_children: false,
  has_content: true,
  is_favorite: false,
};

function mockActions() {
  useDocumentTreeNodeActionsMock.mockReturnValue({
    archiveDocumentMutation: { isPending: false },
    createSubdocumentMutation: { isPending: false },
    duplicateDocumentMutation: { isPending: false },
    favoriteMutation: { isPending: false },
    handleArchive: vi.fn(),
    handleCopyLink: vi.fn(),
    handleCreateSubdocument: vi.fn(),
    handleDuplicate: vi.fn(),
    handleToggleFavorite: vi.fn(),
    isFavorite: false,
  });
}

describe('DocumentTreeNodeActions', () => {
  beforeEach(() => {
    useDocumentTreeNodeActionsMock.mockReset();
    mockActions();
  });

  it('keeps only copy link and favorite actions in read-only mode', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delay={0}>
        <DocumentTreeNodeActions
          mode="readOnly"
          document={documentFixture}
          shouldNavigateOnArchive={false}
          workspaceSlug="acme"
          treeScope="private"
        />
      </TooltipProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Create subdocument' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open document actions' }));

    expect(await screen.findByRole('menuitem', { name: 'Copy link' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Add to favorites' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Duplicate' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Move to Trash' })).not.toBeInTheDocument();
  });

  it('shows the create subdocument tooltip on hover in full mode', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delay={0}>
        <DocumentTreeNodeActions
          mode="full"
          document={documentFixture}
          shouldNavigateOnArchive={false}
          workspaceSlug="acme"
          treeScope="private"
        />
      </TooltipProvider>,
    );

    await user.hover(screen.getByRole('button', { name: 'Create subdocument' }));

    expect(await screen.findByText('Add a document inside')).toBeInTheDocument();
  });
});
