export const BROADCAST_COLLABORATION_ORIGIN = Symbol('document-broadcast');
export const SOCKET_COLLABORATION_ORIGIN = Symbol('document-socket');

export {
  clearDocumentCollaborationStorageForOwner,
  clearDocumentCollaborationStorageForUser,
  documentCollaborationChannelName,
  documentCollaborationStorageName,
  documentCollaborationStoragePrefix,
} from '@/domains/document/document-collaboration-storage';
