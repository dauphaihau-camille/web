'use client';

import type { Document } from '@/domains/document';
import { InvitePanel } from './invite-panel/invite-panel';
import { ShareOverview } from './share-overview/share-overview';
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

  if (shareTab.isInviteMode) {
    return (
      <InvitePanel
        canInvite={shareTab.canInvite}
        canManageAccess={canManageAccess}
        invitePermission={shareTab.invitePermission}
        inviteQuery={shareTab.inviteQuery}
        isArchived={isArchived}
        memberSuggestions={shareTab.memberSuggestions}
        selectedInvitees={shareTab.selectedInvitees}
        onAddInvitee={shareTab.addInvitee}
        onBack={() => shareTab.setInviteMode(false)}
        onInvite={() => {
          void shareTab.inviteSelected();
        }}
        onInvitePermissionChange={shareTab.setInvitePermission}
        onInviteQueryChange={shareTab.setInviteQuery}
        onRemoveInvitee={shareTab.removeInvitee}
        onRemoveLastInvitee={shareTab.removeLastInvitee}
      />
    );
  }

  return (
    <ShareOverview
      canManageAccess={canManageAccess}
      collaborators={shareTab.collaborators}
      currentUserId={shareTab.currentUserId}
      documentTitle={document.title}
      isArchived={isArchived}
      isMutating={shareTab.isMutating}
      ownerMember={shareTab.ownerMember}
      workspaceMemberPermission={shareTab.workspaceMemberPermission}
      workspaceName={shareTab.workspaceName}
      onCopyLink={onCopyLink}
      onOpenInvite={() => shareTab.setInviteMode(true)}
      onPermissionChange={shareTab.updatePermission}
      onRevoke={shareTab.revokeAccess}
      onWorkspaceMemberPermissionChange={shareTab.updateWorkspaceMemberPermission}
    />
  );
}
