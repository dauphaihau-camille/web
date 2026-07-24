import {
  describe, expect, it, vi, 
} from 'vitest';

import {
  apiGet,
  apiPost,
} from '@shared/lib/api-client';

import {
  getDocument,
  getDocumentAccessSettings,
  getWorkspaceChildDocuments,
  shareDocuments,
} from './document.requests';

vi.mock('@shared/lib/api-client', () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

describe('document requests', () => {
  it('normalizes null workspace member access on document detail responses', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      id: 'doc-1',
      public_id: 'public-doc-1',
      version: 1,
      workspace_id: 'workspace-1',
      owner_user_id: 'user-1',
      teamspace_id: null,
      parent_document_id: null,
      title: 'Plan',
      content_format: 'blocknote_v1',
      content: [],
      sort_key: 0,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      access: {
        scope: 'private',
        permission: 'manage',
        can_view: true,
        can_edit: true,
        can_manage: true,
        workspace_member_permission: null,
      },
      collaboration: {
        enabled: false,
        mode: 'edit',
        show_presence: false,
      },
    });

    await expect(getDocument('doc-1')).resolves.toMatchObject({
      access: {
        workspace_member_permission: undefined,
      },
      collaboration: {
        enabled: false,
        mode: 'edit',
        show_presence: false,
      },
    });
  });

  it('normalizes null workspace member access on access settings responses', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      document_id: 'doc-1',
      workspace_member_permission: null,
      updated_by_user_id: 'user-1',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    await expect(getDocumentAccessSettings('doc-1')).resolves.toMatchObject({
      workspace_member_permission: undefined,
    });
  });

  it('loads document children from the dedicated children endpoint', async () => {
    vi.mocked(apiGet).mockResolvedValue([
      {
        id: 'child-1',
        public_id: 'public-child-1',
        title: 'Architecture Decisions',
        teamspace_id: 'teamspace-1',
        parent_document_id: 'parent-1',
        sort_key: 1,
        has_children: false,
        has_content: true,
        is_favorite: false,
      },
    ]);

    await expect(getWorkspaceChildDocuments('acme-product', {
      parent_document_id: 'parent-1',
      limit: 50,
    })).resolves.toEqual({
      items: [
        {
          id: 'child-1',
          public_id: 'public-child-1',
          title: 'Architecture Decisions',
          teamspace_id: 'teamspace-1',
          parent_document_id: 'parent-1',
          sort_key: 1,
          has_children: false,
          has_content: true,
          is_favorite: false,
        },
      ],
    });

    expect(apiGet).toHaveBeenCalledWith('documents/parent-1/children');
  });

  it('shares a document with multiple users through the bulk endpoint', async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({
      collaborators: [
        {
          id: 'grant-1',
          document_id: 'doc-1',
          user: {
            id: 'user-1',
            email: 'one@example.com',
          },
          permission: 'edit',
          granted_by_user_id: 'owner-user',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'grant-2',
          document_id: 'doc-1',
          user: {
            id: 'user-2',
            email: 'two@example.com',
          },
          permission: 'view',
          granted_by_user_id: 'owner-user',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      failed: [
        {
          user_id: 'missing-user',
          reason: 'workspace_user_not_found',
        },
      ],
    });

    await expect(shareDocuments('doc-1', {
      grants: [
        {
          user_id: 'user-1',
          permission: 'edit',
        },
        {
          user_id: 'user-2',
          permission: 'view',
        },
      ],
    })).resolves.toMatchObject({
      collaborators: [
        { id: 'grant-1' },
        { id: 'grant-2' },
      ],
      failed: [
        {
          user_id: 'missing-user',
          reason: 'workspace_user_not_found',
        },
      ],
    });

    expect(apiPost).toHaveBeenCalledWith('documents/doc-1/shares', {
      grants: [
        {
          user_id: 'user-1',
          permission: 'edit',
        },
        {
          user_id: 'user-2',
          permission: 'view',
        },
      ],
    });
  });
});
