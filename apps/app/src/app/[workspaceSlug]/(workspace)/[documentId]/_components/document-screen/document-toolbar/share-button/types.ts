import type { Document } from '@/domains/document';

export type ShareButtonProps = {
  canManageAccess: boolean;
  canEdit: boolean;
  document: Document;
  isArchived: boolean;
  isPublished: boolean;
  isPublishing: boolean;
  isRestoring: boolean;
  isUnpublishing: boolean;
  publishedPath?: string;
  workspaceSlug: string;
  onCopyLink: () => void | Promise<void>;
  onCopyPublishedLink: () => void | Promise<void>;
  onPublish: () => void;
  onRestore: () => void;
  onUnpublish: () => void;
};

export type PublishTabContentProps = Pick<
  ShareButtonProps,
  | 'isArchived'
  | 'canEdit'
  | 'isPublished'
  | 'isPublishing'
  | 'isRestoring'
  | 'isUnpublishing'
  | 'onCopyPublishedLink'
  | 'onPublish'
  | 'onRestore'
  | 'onUnpublish'
> & {
  publicUrl: string;
};
