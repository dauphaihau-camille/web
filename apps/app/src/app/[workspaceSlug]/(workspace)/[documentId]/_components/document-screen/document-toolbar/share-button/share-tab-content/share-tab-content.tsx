'use client';

import type { Document } from '@/domains/document';
import { InvitePanel } from './invite-panel/invite-panel';
import { ShareOverview } from './share-overview/share-overview';
import { ShareTabProvider } from './share-tab-context';
import { useShareTab } from '../_hooks/use-share-tab';

type ShareTabContentProps = {
  canManageAccess: boolean;
  document: Document;
  isArchived: boolean;
  workspaceSlug: string;
  onCopyLink: () => void | Promise<void>;
};

export function ShareTabContent({
  canManageAccess,
  document,
  isArchived,
  workspaceSlug,
  onCopyLink,
}: ShareTabContentProps) {
  const shareTab = useShareTab({
    canManageAccess,
    document,
    isArchived,
    workspaceSlug,
  });

  return (
    <ShareTabProvider
      value={{
        ...shareTab,
        copyLink: onCopyLink,
      }}
    >
      {shareTab.isInviteMode ? <InvitePanel /> : <ShareOverview />}
    </ShareTabProvider>
  );
}
