'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import type { Document } from '@/domains/document';

import { useInviteComposer } from './use-invite-composer';
import { useShareAccessMutations } from './use-share-access-mutations';
import { useShareAccessQueries } from './use-share-access-queries';

type UseShareTabOptions = {
  canManageAccess: boolean;
  document: Document;
  isArchived: boolean;
  workspaceSlug: string;
};

export function useShareTab({
  canManageAccess,
  document,
  isArchived,
  workspaceSlug,
}: UseShareTabOptions) {
  const [isInviteMode, setIsInviteMode] = useState(false);
  const access = useShareAccessQueries({
    canManageAccess,
    document,
    workspaceSlug,
  });
  const mutations = useShareAccessMutations({
    document,
    workspaceMemberPermission: access.workspaceMemberPermission,
    workspaceSlug,
  });
  const invite = useInviteComposer({
    canManageAccess,
    collaborators: access.collaborators,
    invitations: access.invitations,
    isArchived,
    isInvitePending: mutations.isInvitePending,
    ownerUserId: document.owner_user_id,
    workspaceId: document.workspace_id,
  });

  const inviteSelected = async () => {
    if (!invite.canInvite) {
      return;
    }

    const result = await mutations.shareInvitees(
      invite.selectedInvitees,
      invite.invitePermission,
    );

    invite.resetInvitees();
    setIsInviteMode(false);

    if (result.failed.length > 0) {
      toast(`${result.collaborators.length} invited, ${result.failed.length} failed`);
      return;
    }

    toast('Document shared');
  };

  const setInviteQuery = (query: string) => {
    invite.setInviteQuery(query);

    if (query.trim()) {
      setIsInviteMode(true);
    }
  };

  return {
    invitePanel: {
      actions: {
        addActiveInviteSuggestion: invite.addActiveInviteSuggestion,
        addInvitee: invite.addInvitee,
        back: () => setIsInviteMode(false),
        invite: () => {
          void inviteSelected();
        },
        removeInvitee: invite.removeInvitee,
        removeLastInvitee: invite.removeLastInvitee,
        setInvitePermission: invite.setInvitePermission,
        setInviteQuery,
      },
      state: {
        activeInviteSuggestionId: invite.activeInviteSuggestionId,
        canInvite: invite.canInvite,
        canManageAccess,
        invitePermission: invite.invitePermission,
        inviteQuery: invite.inviteQuery,
        inviteSuggestions: invite.inviteSuggestions,
        isArchived,
        selectedInvitees: invite.selectedInvitees,
      },
    },
    isInviteMode,
    overview: {
      actions: {
        invite: () => {
          void inviteSelected();
        },
        removeInvitee: invite.removeInvitee,
        removeLastInvitee: invite.removeLastInvitee,
        revokeAccess: mutations.revokeAccess,
        revokeInvitation: mutations.revokeInvitation,
        setInvitePermission: invite.setInvitePermission,
        setInviteQuery,
        updateInvitationPermission: mutations.updateInvitationPermission,
        updatePermission: mutations.updatePermission,
        updateWorkspaceMemberPermission: mutations.updateWorkspaceMemberPermission,
      },
      state: {
        canInvite: invite.canInvite,
        canManageAccess,
        collaborators: access.collaborators,
        currentUserId: access.currentUserId,
        documentTitle: document.title,
        invitePermission: invite.invitePermission,
        inviteQuery: invite.inviteQuery,
        invitations: access.invitations,
        isArchived,
        isMutating: mutations.isMutating,
        ownerMember: access.ownerMember,
        selectedInvitees: invite.selectedInvitees,
        workspaceMemberPermission: access.workspaceMemberPermission,
        workspaceName: access.workspaceName,
      },
    },
  };
}
