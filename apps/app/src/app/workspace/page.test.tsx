import WorkspaceEntryPage from './page';

const {
  getDefaultWorkspaceServerMock,
  getDocumentServerMock,
  getRecentWorkspaceDocumentIdServerMock,
  getWorkspaceDefaultDocumentServerMock,
  redirectMock,
  requireCurrentUserServerMock,
} = vi.hoisted(() => ({
  getDefaultWorkspaceServerMock: vi.fn(),
  getDocumentServerMock: vi.fn(),
  getRecentWorkspaceDocumentIdServerMock: vi.fn(),
  getWorkspaceDefaultDocumentServerMock: vi.fn(),
  redirectMock: vi.fn(),
  requireCurrentUserServerMock: vi.fn(),
}));

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
  createRootDocumentServer: vi.fn(),
  getDocumentServer: getDocumentServerMock,
  getWorkspaceDefaultDocumentServer: getWorkspaceDefaultDocumentServerMock,
}));

vi.mock('@/domains/workspace/api/workspace.server.requests', () => ({
  getDefaultWorkspaceServer: getDefaultWorkspaceServerMock,
}));

describe('WorkspaceEntryPage', () => {
  beforeEach(() => {
    getDefaultWorkspaceServerMock.mockReset();
    getDocumentServerMock.mockReset();
    getRecentWorkspaceDocumentIdServerMock.mockReset();
    getWorkspaceDefaultDocumentServerMock.mockReset();
    redirectMock.mockReset();
    requireCurrentUserServerMock.mockReset();

    redirectMock.mockImplementation((path: string) => {
      throw Object.assign(new Error('NEXT_REDIRECT'), { path });
    });
    requireCurrentUserServerMock.mockResolvedValue(undefined);
    getRecentWorkspaceDocumentIdServerMock.mockResolvedValue('recent-doc-1');
  });

  it('redirects directly to the default workspace document', async () => {
    getDefaultWorkspaceServerMock.mockResolvedValue({ slug: 'acme-product' });
    getWorkspaceDefaultDocumentServerMock.mockResolvedValue({
      document_id: 'doc-1',
    });
    getDocumentServerMock.mockResolvedValue({
      public_id: '91f35adf4eb9b9b15ec4c8a97cb1f912',
      title: 'Untitled',
    });

    await expect(WorkspaceEntryPage()).rejects.toMatchObject({
      path: '/w/acme-product/untitled-91f35adf4eb9b9b15ec4c8a97cb1f912',
    });

    expect(requireCurrentUserServerMock).toHaveBeenCalledWith('/workspace');
    expect(getWorkspaceDefaultDocumentServerMock).toHaveBeenCalledWith(
      'acme-product',
      'recent-doc-1',
    );
    expect(redirectMock).toHaveBeenCalledWith(
      '/w/acme-product/untitled-91f35adf4eb9b9b15ec4c8a97cb1f912',
    );
  });
});
