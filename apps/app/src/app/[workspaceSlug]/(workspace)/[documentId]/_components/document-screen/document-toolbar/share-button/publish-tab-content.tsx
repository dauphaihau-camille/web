import { PublishArchivedState } from './publish-archived-state';
import { PublishDraftState } from './publish-draft-state';
import { PublishLiveState } from './publish-live-state';
import type { PublishTabContentProps } from './types';

type PublishTabContentViewProps = PublishTabContentProps & {
  copyPublishedLinkShortcut: string;
};

export function PublishTabContent({
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
        isRestoring={isRestoring}
        onRestore={onRestore}
      />
    );
  }

  if (isPublished) {
    return (
      <PublishLiveState
        publicUrl={publicUrl}
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
      onPublish={onPublish}
    />
  );
}
