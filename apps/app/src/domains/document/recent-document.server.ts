import 'server-only';

import { cookies } from 'next/headers';

import type { WorkspaceId } from './api/document.types';
import { getRecentWorkspaceDocumentKey } from './recent-document';

export async function getRecentWorkspaceDocumentIdServer(workspaceId: WorkspaceId) {
  const cookieStore = await cookies();

  return cookieStore.get(getRecentWorkspaceDocumentKey(workspaceId))?.value ?? null;
}
