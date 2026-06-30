const WORKSPACE_ENTRY_PATH = '/workspace';

export const workspaceRoutes = {
  entry() {
    return WORKSPACE_ENTRY_PATH;
  },
  detail(workspaceId: string) {
    return `/${workspaceId}`;
  },
  document(workspaceId: string, documentId: string) {
    return `/${workspaceId}/${documentId}`;
  },
  settings(workspaceId: string) {
    return `/${workspaceId}/settings`;
  },
  settingsMembers(workspaceId: string) {
    return `/${workspaceId}/settings/members`;
  },
} as const;
