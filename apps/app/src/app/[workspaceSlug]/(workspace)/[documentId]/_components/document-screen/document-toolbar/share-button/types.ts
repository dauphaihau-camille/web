export type ShareButtonProps = {
  canEdit: boolean;
  isArchived: boolean;
  isPublished: boolean;
  isPublishing: boolean;
  isRestoring: boolean;
  isUnpublishing: boolean;
  publishedPath?: string;
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
