'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  documentKeys,
  revokeDocumentAccess,
  revokeDocumentInvitation,
  shareDocument,
  shareDocuments,
  updateDocumentAccessSettings,
  updateDocumentInvitation,
  type Document,
  type DocumentAccessGrantPermission,
  type DocumentCollaborator,
  type DocumentInvitation,
} from '@/domains/document';
import { favoriteKeys } from '@/domains/favorite';
import { searchKeys } from '@/domains/search';

import type { SelectedInvitee } from './use-invite-composer';

type UseShareAccessMutationsOptions = {
  document: Document;
  workspaceMemberPermission?: DocumentAccessGrantPermission;
  workspaceSlug: string;
};

export function useShareAccessMutations({
  document,
  workspaceMemberPermission,
  workspaceSlug,
}: UseShareAccessMutationsOptions) {
  const queryClient = useQueryClient();

  const invalidateSharingState = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: documentKeys.collaborators(document.id),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.invitations(document.id),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.accessSettings(document.id),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.detail(document.id),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.detail(document.public_id),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.lists(document.workspace_id),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      }),
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.workspaceList(workspaceSlug),
      }),
      queryClient.invalidateQueries({
        queryKey: searchKeys.all(),
      }),
    ]);
  };

  const upsertInvitations = (invitations: DocumentInvitation[]) => {
    queryClient.setQueryData<DocumentInvitation[]>(
      documentKeys.invitations(document.id),
      (existing = []) => {
        const invitationsById = new Map(
          existing.map((invitation) => [invitation.id, invitation]),
        );

        for (const invitation of invitations) {
          invitationsById.set(invitation.id, invitation);
        }

        return Array.from(invitationsById.values());
      },
    );
  };

  const upsertCollaborators = (collaborators: DocumentCollaborator[]) => {
    queryClient.setQueryData<DocumentCollaborator[]>(
      documentKeys.collaborators(document.id),
      (existing = []) => {
        const collaboratorsById = new Map(
          existing.map((collaborator) => [collaborator.user.id, collaborator]),
        );

        for (const collaborator of collaborators) {
          collaboratorsById.set(collaborator.user.id, collaborator);
        }

        return Array.from(collaboratorsById.values());
      },
    );
  };

  const shareMutation = useMutation({
    mutationFn: async (input: {
      permission: DocumentAccessGrantPermission;
      userId: string;
    }) =>
      shareDocument(document.id, {
        user_id: input.userId,
        permission: input.permission,
      }),
    onSuccess: async (collaborator) => {
      await invalidateSharingState();
      upsertCollaborators([collaborator]);
    },
  });

  const shareManyMutation = useMutation({
    mutationFn: async (input: {
      grants: Array<{
        email?: string;
        permission: DocumentAccessGrantPermission;
        userId?: string;
      }>;
    }) =>
      shareDocuments(document.id, {
        grants: input.grants.map((grant) => ({
          user_id: grant.userId,
          email: grant.email,
          permission: grant.permission,
        })),
      }),
    onSuccess: async (result) => {
      await invalidateSharingState();
      upsertCollaborators(result.collaborators);
      upsertInvitations(result.invitations);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (userId: string) => revokeDocumentAccess(document.id, userId),
    onSuccess: async (_revokedAccess, userId) => {
      await invalidateSharingState();
      queryClient.setQueryData<DocumentCollaborator[]>(
        documentKeys.collaborators(document.id),
        (existing = []) =>
          existing.filter((collaborator) => collaborator.user.id !== userId),
      );
    },
  });

  const updateAccessSettingsMutation = useMutation({
    mutationFn: (permission: DocumentAccessGrantPermission | undefined) =>
      updateDocumentAccessSettings(document.id, {
        workspace_member_permission: permission ?? null,
      }),
    onSuccess: invalidateSharingState,
  });

  const updateInvitationMutation = useMutation({
    mutationFn: (input: {
      invitationId: string;
      permission: DocumentAccessGrantPermission;
    }) =>
      updateDocumentInvitation(document.id, input.invitationId, {
        permission: input.permission,
      }),
    onSuccess: async (invitation) => {
      await invalidateSharingState();
      upsertInvitations([invitation]);
    },
  });

  const revokeInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => revokeDocumentInvitation(document.id, invitationId),
    onSuccess: async (_revokedInvitation, invitationId) => {
      await invalidateSharingState();
      queryClient.setQueryData<DocumentInvitation[]>(
        documentKeys.invitations(document.id),
        (existing = []) =>
          existing.filter((invitation) => invitation.id !== invitationId),
      );
    },
  });

  const isMutating =
    shareMutation.isPending
    || shareManyMutation.isPending
    || revokeMutation.isPending
    || updateInvitationMutation.isPending
    || revokeInvitationMutation.isPending
    || updateAccessSettingsMutation.isPending;

  const shareInvitees = (
    invitees: SelectedInvitee[],
    permission: DocumentAccessGrantPermission,
  ) =>
    shareManyMutation.mutateAsync({
      grants: invitees.map((invitee) => ({
        userId: invitee.userId,
        email: invitee.userId ? undefined : invitee.email,
        permission,
      })),
    });

  const updatePermission = (
    collaborator: DocumentCollaborator,
    permission: DocumentAccessGrantPermission,
  ) => {
    if (collaborator.permission === permission || isMutating) {
      return;
    }

    shareMutation.mutate({
      userId: collaborator.user.id,
      permission,
    }, {
      onSuccess: () => {
        toast('Updated access');
      },
    });
  };

  const revokeAccess = (collaborator: DocumentCollaborator) => {
    if (isMutating) {
      return;
    }

    revokeMutation.mutate(collaborator.user.id, {
      onSuccess: () => {
        toast('Access revoked');
      },
    });
  };

  const updateInvitationPermission = (
    invitation: DocumentInvitation,
    permission: DocumentAccessGrantPermission,
  ) => {
    if (invitation.permission === permission || isMutating) {
      return;
    }

    updateInvitationMutation.mutate({
      invitationId: invitation.id,
      permission,
    }, {
      onSuccess: () => {
        toast('Updated invitation');
      },
    });
  };

  const revokeInvitation = (invitation: DocumentInvitation) => {
    if (isMutating) {
      return;
    }

    revokeInvitationMutation.mutate(invitation.id, {
      onSuccess: () => {
        toast('Invitation revoked');
      },
    });
  };

  const updateWorkspaceMemberPermission = (
    permission: DocumentAccessGrantPermission | undefined,
  ) => {
    if (workspaceMemberPermission === permission || isMutating) {
      return;
    }

    updateAccessSettingsMutation.mutate(permission, {
      onSuccess: () => {
        toast(permission ? 'Workspace access updated' : 'Workspace access restricted');
      },
    });
  };

  return {
    isInvitePending: shareManyMutation.isPending,
    isMutating,
    revokeAccess,
    revokeInvitation,
    shareInvitees,
    updateInvitationPermission,
    updatePermission,
    updateWorkspaceMemberPermission,
  };
}
