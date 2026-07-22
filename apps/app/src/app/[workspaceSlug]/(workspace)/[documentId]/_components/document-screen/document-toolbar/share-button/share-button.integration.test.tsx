import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OPEN_SHARE_EVENT } from '@/app/[workspaceSlug]/_components/workspace-shortcuts-provider';
import { renderWithProviders } from '@shared/test/render';

import { ShareButton } from './share-button';

const marketingHost = 'http://localhost:4001';

describe('ShareButton integration', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/acme/doc-1');
  });

  it('opens from the workspace share shortcut event and publishes an unpublished document', async () => {
    const onPublish = vi.fn();

    renderWithProviders(
      <ShareButton
        canEdit
        isArchived={false}
        isPublished={false}
        isPublishing={false}
        isRestoring={false}
        isUnpublishing={false}
        onCopyPublishedLink={vi.fn()}
        onPublish={onPublish}
        onRestore={vi.fn()}
        onUnpublish={vi.fn()}
      />,
    );

    await act(async () => {
      window.dispatchEvent(new CustomEvent(OPEN_SHARE_EVENT));
    });

    const publishButton = await screen.findByRole('button', { name: 'Publish' });

    await userEvent.setup().click(publishButton);

    expect(onPublish).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Publish to web')).toBeInTheDocument();
  });

  it('shows the published URL and supports copy plus unpublish actions', async () => {
    const onCopyPublishedLink = vi.fn();
    const onUnpublish = vi.fn();

    renderWithProviders(
      <ShareButton
        canEdit
        isArchived={false}
        isPublished
        isPublishing={false}
        isRestoring={false}
        isUnpublishing={false}
        publishedPath="/share/published-doc"
        onCopyPublishedLink={onCopyPublishedLink}
        onPublish={vi.fn()}
        onRestore={vi.fn()}
        onUnpublish={onUnpublish}
      />,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Share' }));

    expect(
      await screen.findByDisplayValue(`${marketingHost}/share/published-doc`),
    ).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Copy link' }));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Unpublish' }));

    expect(onCopyPublishedLink).toHaveBeenCalledTimes(1);
    expect(onUnpublish).toHaveBeenCalledTimes(1);
  });

  it('keeps published link actions available but disables mutating actions when read-only', async () => {
    const onCopyPublishedLink = vi.fn();
    const onUnpublish = vi.fn();

    renderWithProviders(
      <ShareButton
        canEdit={false}
        isArchived={false}
        isPublished
        isPublishing={false}
        isRestoring={false}
        isUnpublishing={false}
        publishedPath="/share/published-doc"
        onCopyPublishedLink={onCopyPublishedLink}
        onPublish={vi.fn()}
        onRestore={vi.fn()}
        onUnpublish={onUnpublish}
      />,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Share' }));

    await userEvent.setup().click(screen.getByRole('button', { name: 'Copy link' }));
    expect(onCopyPublishedLink).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeDisabled();
  });
});
