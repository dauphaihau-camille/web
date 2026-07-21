export const BROADCAST_COLLABORATION_ORIGIN = Symbol('document-broadcast');
export const SOCKET_COLLABORATION_ORIGIN = Symbol('document-socket');

export function documentCollaborationStorageName(documentId: string): string {
  return `camille:document:${documentId}`;
}

export function documentCollaborationChannelName(documentId: string): string {
  return `camille:document:${documentId}`;
}
