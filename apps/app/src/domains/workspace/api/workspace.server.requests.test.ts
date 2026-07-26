import {
  getDefaultWorkspaceServer,
  getLastActiveWorkspaceServer,
} from './workspace.server.requests';

const {
  apiServerGetMock,
  apiServerRequestMock,
} = vi.hoisted(() => ({
  apiServerGetMock: vi.fn(),
  apiServerRequestMock: vi.fn(),
}));

vi.mock('server-only', () => ({}));

vi.mock('@shared/lib/api-server', () => ({
  apiServerGet: apiServerGetMock,
  apiServerRequest: apiServerRequestMock,
}));

const workspaceFixture = {
  id: 'workspace-1',
  version: 1,
  name: 'Acme Product',
  slug: 'acme-product',
  description: null,
  current_user_role: 'owner',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('workspace server requests', () => {
  beforeEach(() => {
    apiServerGetMock.mockReset();
    apiServerRequestMock.mockReset();
  });

  it('treats a missing last-active workspace as no last-active workspace', async () => {
    apiServerRequestMock.mockResolvedValue(new Response(JSON.stringify({
      message: 'Workspace was not found',
    }), {
      status: 404,
    }));

    await expect(getLastActiveWorkspaceServer()).resolves.toBeNull();
  });

  it('falls back to the first workspace when last-active points to a deleted workspace', async () => {
    apiServerRequestMock.mockResolvedValue(new Response(JSON.stringify({
      message: 'Workspace was not found',
    }), {
      status: 404,
    }));
    apiServerGetMock.mockResolvedValue([workspaceFixture]);

    await expect(getDefaultWorkspaceServer()).resolves.toMatchObject({
      slug: 'acme-product',
    });

    expect(apiServerRequestMock).toHaveBeenCalledWith('me/workspaces/last-active');
    expect(apiServerGetMock).toHaveBeenCalledWith('me/workspaces');
  });

  it('still throws when last-active fails for reasons other than not found', async () => {
    apiServerRequestMock.mockResolvedValue(new Response(JSON.stringify({
      message: 'Backend failed',
    }), {
      status: 500,
    }));

    await expect(getDefaultWorkspaceServer()).rejects.toMatchObject({
      status: 500,
    });

    expect(apiServerGetMock).not.toHaveBeenCalled();
  });
});
