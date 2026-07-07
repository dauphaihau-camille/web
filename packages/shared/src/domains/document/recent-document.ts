import type { WorkspaceId } from './api/document.types';

const RECENT_WORKSPACE_DOCUMENT_PREFIX = 'recent-workspace-document:';
const RECENT_WORKSPACE_DOCUMENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function getRecentWorkspaceDocumentKey(workspaceId: WorkspaceId) {
  return `${RECENT_WORKSPACE_DOCUMENT_PREFIX}${workspaceId}`;
}

function setRecentWorkspaceDocumentCookie(workspaceId: WorkspaceId, documentId: string) {
  document.cookie = [
    `${encodeURIComponent(getRecentWorkspaceDocumentKey(workspaceId))}=${encodeURIComponent(documentId)}`,
    'Path=/',
    `Max-Age=${RECENT_WORKSPACE_DOCUMENT_COOKIE_MAX_AGE}`,
    'SameSite=Lax',
  ].join('; ');
}

function clearRecentWorkspaceDocumentCookie(workspaceId: WorkspaceId) {
  document.cookie = [
    `${encodeURIComponent(getRecentWorkspaceDocumentKey(workspaceId))}=`,
    'Path=/',
    'Max-Age=0',
    'SameSite=Lax',
  ].join('; ');
}

export function getRecentWorkspaceDocumentId(workspaceId: WorkspaceId) {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(getRecentWorkspaceDocumentKey(workspaceId));
}

export function setRecentWorkspaceDocumentId(
  workspaceId: WorkspaceId,
  documentId: string,
) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getRecentWorkspaceDocumentKey(workspaceId), documentId);
  setRecentWorkspaceDocumentCookie(workspaceId, documentId);
}

export function clearRecentWorkspaceDocumentId(workspaceId: WorkspaceId) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(getRecentWorkspaceDocumentKey(workspaceId));
  clearRecentWorkspaceDocumentCookie(workspaceId);
}
