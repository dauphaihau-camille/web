import WorkspacePage from './page';

const {
  createRootDocumentServerMock,
  getDocumentServerMock,
  getDefaultWorkspaceServerMock,
  getRecentWorkspaceDocumentIdServerMock,
  getWorkspaceDefaultDocumentServerMock,
  redirectMock,
  requireCurrentUserServerMock,
  MockServerRequestError,
} = vi.hoisted(() => {
  class ServerRequestErrorMock extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
      this.name = 'ServerRequestError';
    }
  }

  return {
    createRootDocumentServerMock: vi.fn(),
    getDocumentServerMock: vi.fn(),
    getDefaultWorkspaceServerMock: vi.fn(),
    getRecentWorkspaceDocumentIdServerMock: vi.fn(),
    getWorkspaceDefaultDocumentServerMock: vi.fn(),
    redirectMock: vi.fn(),
    requireCurrentUserServerMock: vi.fn(),
    MockServerRequestError: ServerRequestErrorMock,
  };
});

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/domains/auth/api/auth.server.requests', () => ({
  requireCurrentUserServer: requireCurrentUserServerMock,
}));

vi.mock('@/domains/document/recent-document.server', () => ({
  getRecentWorkspaceDocumentIdServer: getRecentWorkspaceDocumentIdServerMock,
}));

vi.mock('@/domains/document/api/document.server.requests', () => ({
  createRootDocumentServer: createRootDocumentServerMock,
  getDocumentServer: getDocumentServerMock,
  getWorkspaceDefaultDocumentServer: getWorkspaceDefaultDocumentServerMock,
  isServerRequestError: (error: unknown, status?: number) =>
    error instanceof MockServerRequestError
    && (status === undefined || error.status === status),
}));

vi.mock('@/domains/workspace/api/workspace.server.requests', () => ({
  getDefaultWorkspaceServer: getDefaultWorkspaceServerMock,
}));

describe('WorkspacePage', () => {
  beforeEach(() => {
    createRootDocumentServerMock.mockReset();
    getDocumentServerMock.mockReset();
    getDefaultWorkspaceServerMock.mockReset();
    getRecentWorkspaceDocumentIdServerMock.mockReset();
    getWorkspaceDefaultDocumentServerMock.mockReset();
    redirectMock.mockReset();
    requireCurrentUserServerMock.mockReset();

    redirectMock.mockImplementation((path: string) => {
      throw Object.assign(new Error('NEXT_REDIRECT'), { path });
    });
    requireCurrentUserServerMock.mockResolvedValue(undefined);
    getDefaultWorkspaceServerMock.mockResolvedValue(null);
    getRecentWorkspaceDocumentIdServerMock.mockResolvedValue(null);
  });

  it('redirects unknown workspace slugs directly to the default workspace document', async () => {
    getWorkspaceDefaultDocumentServerMock.mockRejectedValueOnce(
      new MockServerRequestError('Workspace was not found', 404),
    );
    getWorkspaceDefaultDocumentServerMock.mockResolvedValueOnce({
      document_id: 'doc-1',
    });
    getDocumentServerMock.mockResolvedValue({
      public_id: 'public-doc-1',
      title: 'Account Health Review',
    });
    getDefaultWorkspaceServerMock.mockResolvedValue({
      slug: 'acme',
    });

    await expect(WorkspacePage({
      params: Promise.resolve({ workspaceSlug: 'missing-workspace' }),
    })).rejects.toMatchObject({ path: '/w/acme/account-health-review-public-doc-1' });

    expect(requireCurrentUserServerMock).toHaveBeenCalledWith('/w/missing-workspace');
    expect(getWorkspaceDefaultDocumentServerMock).toHaveBeenNthCalledWith(1, 'missing-workspace', null);
    expect(getWorkspaceDefaultDocumentServerMock).toHaveBeenNthCalledWith(2, 'acme', null);
    expect(getDefaultWorkspaceServerMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith('/w/acme/account-health-review-public-doc-1');
    expect(createRootDocumentServerMock).not.toHaveBeenCalled();
  });

  it('creates a root document when redirecting to a default workspace without documents', async () => {
    getWorkspaceDefaultDocumentServerMock.mockRejectedValueOnce(
      new MockServerRequestError('Workspace was not found', 404),
    );
    getWorkspaceDefaultDocumentServerMock.mockResolvedValueOnce({});
    getDefaultWorkspaceServerMock.mockResolvedValue({
      slug: 'acme',
    });
    createRootDocumentServerMock.mockResolvedValue({
      public_id: 'public-doc-2',
      title: 'Untitled',
    });

    await expect(WorkspacePage({
      params: Promise.resolve({ workspaceSlug: 'missing-workspace' }),
    })).rejects.toMatchObject({ path: '/w/acme/untitled-public-doc-2' });

    expect(createRootDocumentServerMock).toHaveBeenCalledWith({ workspace_id: 'acme' });
    expect(redirectMock).toHaveBeenCalledWith('/w/acme/untitled-public-doc-2');
  });

  it('redirects unknown workspace slugs to workspace entry when there is no default workspace', async () => {
    getWorkspaceDefaultDocumentServerMock.mockRejectedValue(
      new MockServerRequestError('Workspace was not found', 404),
    );

    await expect(WorkspacePage({
      params: Promise.resolve({ workspaceSlug: 'missing-workspace' }),
    })).rejects.toMatchObject({ path: '/workspace' });

    expect(redirectMock).toHaveBeenCalledWith('/workspace');
    expect(createRootDocumentServerMock).not.toHaveBeenCalled();
  });

  it('keeps non-404 default document failures on the error boundary path', async () => {
    const error = new MockServerRequestError('Backend failed', 500);
    getWorkspaceDefaultDocumentServerMock.mockRejectedValue(error);

    await expect(WorkspacePage({
      params: Promise.resolve({ workspaceSlug: 'acme' }),
    })).rejects.toBe(error);

    expect(redirectMock).not.toHaveBeenCalled();
  });
});
