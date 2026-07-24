import { act, screen } from '@testing-library/react';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { ComponentProps } from 'react';

import { OPEN_SHARE_EVENT } from '@/app/[workspaceSlug]/_components/workspace-shortcuts-provider';
import type { Document } from '@/domains/document';
import { renderWithProviders } from '@shared/test/render';
import { mswServer } from '@shared/test/msw/server';

import { ShareButton } from './share-button';

const marketingHost = 'http://localhost:4001';
const documentFixture: Document = {
  id: 'doc-1',
  public_id: 'public-doc-1',
  version: 1,
  workspace_id: 'acme',
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
};

function renderShareButton(
  props?: Partial<ComponentProps<typeof ShareButton>>,
  options?: {
    collaborators?: unknown[];
    currentUser?: {
      displayName: string;
      email: string;
      id: string;
    };
    invitations?: unknown[];
    members?: unknown[];
  },
) {
  const collaborators = options?.collaborators ?? [];
  const invitations = options?.invitations ?? [];
  const currentUser = options?.currentUser ?? {
    displayName: 'Owner',
    email: 'owner@example.com',
    id: 'user-1',
  };
  const members = options?.members ?? [
    {
      id: 'membership-1',
      version: 1,
      user_id: 'user-1',
      email: 'owner@example.com',
      display_name: 'Owner',
      role: 'owner',
      joined_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  mswServer.use(
    http.get(/\/auth\/me\/?$/, () =>
      HttpResponse.json({
        id: currentUser.id,
        email: currentUser.email,
        display_name: currentUser.displayName,
        status: 'active',
        session_id: 'session-1',
        roles: [],
        permissions: [],
      })),
    http.get(/\/workspaces\/acme\/?$/, () =>
      HttpResponse.json({
        id: 'acme',
        version: 1,
        slug: 'acme',
        name: 'Acme Product',
        description: undefined,
        current_user_role: 'owner',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      })),
    http.get(/\/workspaces\/acme\/members\/?$/, () =>
      HttpResponse.json(members)),
    http.get(/\/documents\/doc-1\/collaborators\/?$/, () => HttpResponse.json(collaborators)),
    http.get(/\/documents\/doc-1\/invitations\/?$/, () => HttpResponse.json(invitations)),
    http.get(/\/documents\/doc-1\/access-settings\/?$/, () =>
      HttpResponse.json({
        document_id: 'doc-1',
        updated_by_user_id: 'user-1',
        created_at: '1970-01-01T00:00:00.000Z',
        updated_at: '1970-01-01T00:00:00.000Z',
      })),
  );

  return renderWithProviders(
    <ShareButton
      canManageAccess
      canEdit
      document={documentFixture}
      isArchived={false}
      isPublished={false}
      isPublishing={false}
      isRestoring={false}
      isUnpublishing={false}
      workspaceSlug="acme"
      onCopyLink={vi.fn()}
      onCopyPublishedLink={vi.fn()}
      onPublish={vi.fn()}
      onRestore={vi.fn()}
      onUnpublish={vi.fn()}
      {...props}
    />,
  );
}

describe('ShareButton integration', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/acme/doc-1');
  });

  it('opens from the workspace share shortcut event and publishes an unpublished document', async () => {
    const onPublish = vi.fn();

    renderShareButton({ onPublish });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(OPEN_SHARE_EVENT));
    });

    await userEvent.setup().click(await screen.findByRole('tab', { name: 'Publish' }));
    const publishButton = await screen.findByRole('button', { name: 'Publish' });

    await userEvent.setup().click(publishButton);

    expect(onPublish).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Publish to web')).toBeInTheDocument();
  });

  it('shows the published URL and supports copy plus unpublish actions', async () => {
    const onCopyPublishedLink = vi.fn();
    const onUnpublish = vi.fn();

    renderShareButton({
      isPublished: true,
      publishedPath: '/share/published-doc',
      onCopyPublishedLink,
      onUnpublish,
    });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Share' }));
    await userEvent.setup().click(await screen.findByRole('tab', { name: 'Publish' }));

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

    renderShareButton({
      canEdit: false,
      canManageAccess: false,
      isPublished: true,
      publishedPath: '/share/published-doc',
      onCopyPublishedLink,
      onUnpublish,
    });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Share' }));
    await userEvent.setup().click(await screen.findByRole('tab', { name: 'Publish' }));

    await userEvent.setup().click(screen.getByRole('button', { name: 'Copy link' }));
    expect(onCopyPublishedLink).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeDisabled();
  });

  it('selects a workspace member suggestion and sends an invite grant', async () => {
    const sharedUserIds: string[] = [];

    mswServer.use(
      http.post(/\/documents\/doc-1\/shares\/?$/, async ({ request }) => {
        const body = await request.json() as {
          grants: Array<{
            permission: string;
            user_id: string;
          }>;
        };

        sharedUserIds.push(
          ...body.grants.map((grant) => `${grant.user_id}:${grant.permission}`),
        );

        return HttpResponse.json({
          collaborators: body.grants.map((grant) => ({
            id: `grant-${grant.user_id}`,
            document_id: 'doc-1',
            user: {
              id: grant.user_id,
              email: 'kim@example.com',
              display_name: 'Kim Nguyen',
            },
            permission: grant.permission,
            granted_by_user_id: 'user-1',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          })),
          failed: [],
        });
      }),
    );
    renderShareButton(undefined, {
      members: [
        {
          id: 'membership-1',
          version: 1,
          user_id: 'user-1',
          email: 'owner@example.com',
          display_name: 'Owner',
          role: 'owner',
          joined_at: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'membership-2',
          version: 1,
          user_id: 'user-2',
          email: 'kim@example.com',
          display_name: 'Kim Nguyen',
          role: 'member',
          joined_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Share' }));
    await user.click(await screen.findByText('Email or group, separated by commas'));
    const inviteInput = await screen.findByPlaceholderText('Email or name');

    expect(screen.getByRole('button', { name: 'Back to sharing' })).toBeInTheDocument();
    expect(inviteInput).toHaveFocus();

    await user.type(inviteInput, 'kim');
    await user.click(await screen.findByText('Kim Nguyen <kim@example.com>'));

    expect(await screen.findByText('kim@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Invite' }));

    expect(sharedUserIds).toEqual(['user-2:manage']);
    expect(await screen.findByText('Kim Nguyen')).toBeInTheDocument();
  });

  it('invites an unknown email as a pending document invitation', async () => {
    const sharedEmails: string[] = [];

    mswServer.use(
      http.post(/\/documents\/doc-1\/shares\/?$/, async ({ request }) => {
        const body = await request.json() as {
          grants: Array<{
            email?: string;
            permission: string;
            user_id?: string;
          }>;
        };

        sharedEmails.push(
          ...body.grants.map((grant) => `${grant.email}:${grant.permission}`),
        );

        return HttpResponse.json({
          collaborators: [],
          invitations: body.grants.map((grant) => ({
            id: `invitation-${grant.email}`,
            document_id: 'doc-1',
            email: grant.email,
            permission: grant.permission,
            invited_by_user_id: 'user-1',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            status: 'pending',
          })),
          failed: [],
        });
      }),
    );
    renderShareButton();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Share' }));
    await user.click(await screen.findByText('Email or group, separated by commas'));
    const inviteInput = await screen.findByPlaceholderText('Email or name');

    await user.type(inviteInput, 'huongk1lk2clcla@yahoo.com');
    await user.click(await screen.findByText('huongk1lk2clcla@yahoo.com'));
    await user.click(screen.getByRole('button', { name: 'Invite' }));

    expect(sharedEmails).toEqual(['huongk1lk2clcla@yahoo.com:manage']);
    expect(await screen.findByText('huongk1lk2clcla@yahoo.com')).toBeInTheDocument();
    expect(screen.getByText('Invited')).toBeInTheDocument();
  });

  it('shows pending invitations and updates their predefined permission', async () => {
    const invitationUpdates: string[] = [];

    mswServer.use(
      http.patch(/\/documents\/doc-1\/invitations\/invitation-1\/?$/, async ({ request }) => {
        const body = await request.json() as {
          permission: string;
        };
        invitationUpdates.push(body.permission);

        return HttpResponse.json({
          id: 'invitation-1',
          document_id: 'doc-1',
          email: 'huongk1lk2clcla@yahoo.com',
          permission: body.permission,
          invited_by_user_id: 'user-1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          status: 'pending',
        });
      }),
    );
    renderShareButton(undefined, {
      invitations: [
        {
          id: 'invitation-1',
          document_id: 'doc-1',
          email: 'huongk1lk2clcla@yahoo.com',
          permission: 'comment',
          invited_by_user_id: 'user-1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          status: 'pending',
        },
      ],
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByText('huongk1lk2clcla@yahoo.com')).toBeInTheDocument();
    expect(screen.getByText('Invited')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Can comment' }));
    await user.click(await screen.findByText('Can view'));

    expect(invitationUpdates).toEqual(['view']);
    expect(await screen.findByRole('button', { name: 'Can view' })).toBeInTheDocument();
  });

  it('shows the document owner even when the workspace member list omits them', async () => {
    renderShareButton(undefined, {
      members: [
        {
          id: 'membership-2',
          version: 1,
          user_id: 'user-2',
          email: 'member@example.com',
          display_name: 'Member',
          role: 'member',
          joined_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('owner@example.com')).toBeInTheDocument();
    expect(screen.getByText('Full access')).toBeInTheDocument();
  });

  it('shows collaborators to a viewer without manage access', async () => {
    renderShareButton({
      canManageAccess: false,
      document: {
        ...documentFixture,
        access: {
          scope: 'shared',
          permission: 'view',
          can_view: true,
          can_edit: false,
          can_manage: false,
        },
      },
    }, {
      collaborators: [
        {
          id: 'grant-2',
          document_id: 'doc-1',
          user: {
            id: 'user-2',
            email: 'member@example.com',
            display_name: 'Member',
          },
          permission: 'view',
          granted_by_user_id: 'user-1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      currentUser: {
        displayName: 'Member',
        email: 'member@example.com',
        id: 'user-2',
      },
    });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByText('Owner')).toBeInTheDocument();
    expect(await screen.findByText('Member')).toBeInTheDocument();
    expect(screen.getByText('member@example.com')).toBeInTheDocument();

    const accessRows = screen.getAllByText(/Owner|Member/).map((name) =>
      within(name.closest('.flex.items-center')!).getByText(/Owner|Member/).textContent);

    expect(accessRows.slice(0, 2)).toEqual(['Member (You)', 'Owner']);
  });

  it('shows inherited collaborators and turns them into direct grants when changed', async () => {
    const directGrantUpdates: string[] = [];

    mswServer.use(
      http.post(/\/documents\/doc-1\/share\/?$/, async ({ request }) => {
        const body = await request.json() as {
          permission: string;
          user_id: string;
        };
        directGrantUpdates.push(`${body.user_id}:${body.permission}`);

        return HttpResponse.json({
          id: `child-grant-${body.user_id}`,
          document_id: 'doc-1',
          user: {
            id: body.user_id,
            email: 'member@example.com',
            display_name: 'Member',
          },
          permission: body.permission,
          granted_by_user_id: 'user-1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          access_source: 'direct',
        });
      }),
    );
    renderShareButton(undefined, {
      collaborators: [
        {
          id: 'parent-grant-2',
          document_id: 'parent-doc',
          user: {
            id: 'user-2',
            email: 'member@example.com',
            display_name: 'Member',
          },
          permission: 'view',
          granted_by_user_id: 'user-1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          access_source: 'inherited',
          inherited_from_document_id: 'parent-doc',
          inherited_from_document_title: 'Parent document',
        },
      ],
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByText('Member')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Can view' }));
    expect(await screen.findByText('Parent document')).toBeInTheDocument();
    await user.click(screen.getByText('Can edit'));

    expect(directGrantUpdates).toEqual(['user-2:edit']);
    expect(await screen.findByRole('button', { name: 'Can edit' })).toBeInTheDocument();
  });

  it('updates general access for everyone in the workspace', async () => {
    const updates: Array<string | null | undefined> = [];

    mswServer.use(
      http.patch(/\/documents\/doc-1\/access-settings\/?$/, async ({ request }) => {
        const body = await request.json() as {
          workspace_member_permission?: string | null;
        };
        updates.push(body.workspace_member_permission);

        return HttpResponse.json({
          document_id: 'doc-1',
          workspace_member_permission: body.workspace_member_permission ?? undefined,
          updated_by_user_id: 'user-1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        });
      }),
    );
    renderShareButton();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Share' }));
    await user.click(await screen.findByRole('button', { name: /Only people invited/ }));
    const workspaceAccessItem = (await screen.findByText('Everyone at Acme Product'))
      .closest('[role="menuitem"]');
    expect(workspaceAccessItem).not.toBeNull();
    await user.click(workspaceAccessItem!);

    expect(updates).toEqual(['view']);
  });
});
