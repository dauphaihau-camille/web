import {
  describe, expect, it, vi, 
} from 'vitest';

import { apiGet } from '@shared/lib/api-client';

import { getWorkspaceChildDocuments } from './document.requests';

vi.mock('@shared/lib/api-client', () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

describe('document requests', () => {
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
});
