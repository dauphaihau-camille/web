import { PublishArchivedState } from './publish-archived-state';
import { PublishDraftState } from './publish-draft-state';
import { PublishLiveState } from './publish-live-state';
import type { PublishTabContentProps } from './types';

type PublishTabContentViewProps = PublishTabContentProps & {
  copyPublishedLinkShortcut: string;
};

export function PublishTabContent({
  canEdit,
  isArchived,
  isPublished,
  isPublishing,
  isRestoring,
  isUnpublishing,
  publicUrl,
  onCopyPublishedLink,
  onPublish,
  onRestore,
  onUnpublish,
  copyPublishedLinkShortcut,
}: PublishTabContentViewProps) {
  if (isArchived) {
    return (
      <PublishArchivedState
        canEdit={canEdit}
        isRestoring={isRestoring}
        onRestore={onRestore}
      />
    );
  }

  if (isPublished) {
    return (
      <PublishLiveState
        publicUrl={publicUrl}
        canEdit={canEdit}
        isUnpublishing={isUnpublishing}
        onCopyPublishedLink={onCopyPublishedLink}
        onUnpublish={onUnpublish}
        copyPublishedLinkShortcut={copyPublishedLinkShortcut}
      />
    );
  }

  return (
    <PublishDraftState
      isPublishing={isPublishing}
      canEdit={canEdit}
      onPublish={onPublish}
    />
  );
}
