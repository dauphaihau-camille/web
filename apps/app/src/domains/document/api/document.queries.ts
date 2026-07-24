import { queryOptions } from '@tanstack/react-query';

import { documentKeys } from './document.keys';
import {
  getArchivedWorkspaceDocuments,
  getDocumentAccessSettings,
  getDocument,
  listDocumentCollaborators,
  listDocumentInvitations,
  getWorkspaceChildDocuments,
  getWorkspaceRootDocuments,
} from './document.requests';
import type { DocumentId, WorkspaceId } from './document.types';

export function documentDetailQueryOptions(documentId: DocumentId) {
  return queryOptions({
    queryKey: documentKeys.detail(documentId),
    queryFn: () => getDocument(documentId),
    staleTime: 30_000,
  });
}

export function documentCollaboratorsQueryOptions(documentId: DocumentId) {
  return queryOptions({
    queryKey: documentKeys.collaborators(documentId),
    queryFn: () => listDocumentCollaborators(documentId),
    staleTime: 30_000,
  });
}

export function documentInvitationsQueryOptions(documentId: DocumentId) {
  return queryOptions({
    queryKey: documentKeys.invitations(documentId),
    queryFn: () => listDocumentInvitations(documentId),
    staleTime: 30_000,
  });
}

export function documentAccessSettingsQueryOptions(documentId: DocumentId) {
  return queryOptions({
    queryKey: documentKeys.accessSettings(documentId),
    queryFn: () => getDocumentAccessSettings(documentId),
    staleTime: 30_000,
  });
}

export function workspaceDocumentRootQueryOptions(
  workspaceId: WorkspaceId,
  limit = 10,
  cursor?: string,
  query?: string,
) {
  return queryOptions({
    queryKey: documentKeys.rootList(workspaceId, limit, cursor, query),
    queryFn: () => getWorkspaceRootDocuments(workspaceId, {
      limit,
      cursor,
      query,
    }),
  });
}

export function workspaceArchivedDocumentListQueryOptions(
  workspaceId: WorkspaceId,
  limit = 50,
  cursor?: string,
  query?: string,
) {
  return queryOptions({
    queryKey: documentKeys.archivedList(workspaceId, limit, cursor, query),
    queryFn: () => getArchivedWorkspaceDocuments(workspaceId, {
      limit,
      cursor,
      query,
    }),
  });
}

export function workspaceDocumentChildrenQueryOptions(
  workspaceId: WorkspaceId,
  parentDocumentId: DocumentId,
  limit = 50,
  cursor?: string,
) {
  return queryOptions({
    queryKey: documentKeys.childList(workspaceId, parentDocumentId, limit, cursor),
    queryFn: () => getWorkspaceChildDocuments(workspaceId, {
      parent_document_id: parentDocumentId,
      limit,
      cursor,
    }),
  });
}
