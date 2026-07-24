'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useCurrentUserQuery } from '@/domains/auth/hooks/use-current-user-query';
import {
  documentCollaboratorsQueryOptions,
  documentAccessSettingsQueryOptions,
  documentInvitationsQueryOptions,
  documentKeys,
  revokeDocumentInvitation,
  revokeDocumentAccess,
  shareDocument,
  shareDocuments,
  updateDocumentInvitation,
  updateDocumentAccessSettings,
  type Document,
  type DocumentAccessGrantPermission,
  type DocumentCollaborator,
  type DocumentInvitation,
  type DocumentOwnerUser,
} from '@/domains/document';
import { favoriteKeys } from '@/domains/favorite';
import { searchKeys } from '@/domains/search';
import {
  workspaceMemberListQueryOptions,
  workspaceDetailQueryOptions,
} from '@/domains/workspace';

export type SelectedInvitee = {
  email: string;
  displayName?: string;
  userId?: string;
};

export type InviteSuggestion = {
  displayName?: string;
  email: string;
  id: string;
  userId?: string;
};

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
  const [inviteQuery, setInviteQuery] = useState('');
  const [selectedInvitees, setSelectedInvitees] = useState<SelectedInvitee[]>([]);

  const [invitePermission, setInvitePermission] =
    useState<DocumentAccessGrantPermission>('manage');
  const queryClient = useQueryClient();

  const currentUserQuery = useCurrentUserQuery();
  const workspaceQuery = useQuery(workspaceDetailQueryOptions(document.workspace_id));
  const membersQuery = useQuery(workspaceMemberListQueryOptions(document.workspace_id));

  const collaboratorsQuery = useQuery({
    ...documentCollaboratorsQueryOptions(document.id),
    enabled: document.access?.can_view ?? true,
  });

  const invitationsQuery = useQuery({
    ...documentInvitationsQueryOptions(document.id),
    enabled: document.access?.can_view ?? true,
  });

  const accessSettingsQuery = useQuery({
    ...documentAccessSettingsQueryOptions(document.id),
    enabled: canManageAccess,
  });

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

  const ownerMember = useMemo<DocumentOwnerUser | undefined>(() => {
    if (document.owner_user) {
      return document.owner_user;
    }

    const workspaceMember = membersQuery.data?.find((member) =>
      member.user_id === document.owner_user_id);

    return workspaceMember
      ? {
        id: workspaceMember.user_id,
        email: workspaceMember.email,
        display_name: workspaceMember.display_name,
      }
      : undefined;
  }, [document.owner_user, document.owner_user_id, membersQuery.data]);
  const collaboratorsByUserId = useMemo(
    () => new Map(
      (collaboratorsQuery.data ?? []).map((collaborator) => [
        collaborator.user.id,
        collaborator,
      ]),
    ),
    [collaboratorsQuery.data],
  );
  const selectedInviteeIds = useMemo(
    () => new Set(selectedInvitees.flatMap((invitee) =>
      invitee.userId ? [invitee.userId] : [])),
    [selectedInvitees],
  );
  const selectedInviteeEmails = useMemo(
    () => new Set(selectedInvitees.map((invitee) => invitee.email.toLowerCase())),
    [selectedInvitees],
  );
  const invitedEmails = useMemo(
    () => new Set((invitationsQuery.data ?? []).map((invitation) => invitation.email.toLowerCase())),
    [invitationsQuery.data],
  );
  const inviteSuggestions = useMemo(() => {
    const normalizedQuery = inviteQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    const suggestions: InviteSuggestion[] = (membersQuery.data ?? [])
      .filter((member) =>
        member.user_id !== document.owner_user_id
        && !selectedInviteeIds.has(member.user_id)
        && !selectedInviteeEmails.has(member.email.toLowerCase())
        && !collaboratorsByUserId.has(member.user_id)
        && (
          member.email.toLowerCase().includes(normalizedQuery)
          || member.display_name?.toLowerCase().includes(normalizedQuery)
        ))
      .slice(0, 5)
      .map((member) => ({
        displayName: member.display_name,
        email: member.email,
        id: member.user_id,
        userId: member.user_id,
      }));

    if (
      isEmail(normalizedQuery)
      && !selectedInviteeEmails.has(normalizedQuery)
      && !invitedEmails.has(normalizedQuery)
      && !suggestions.some((suggestion) => suggestion.email.toLowerCase() === normalizedQuery)
    ) {
      suggestions.push({
        email: normalizedQuery,
        id: normalizedQuery,
      });
    }

    return suggestions.slice(0, 5);
  }, [
    collaboratorsByUserId,
    document.owner_user_id,
    invitedEmails,
    inviteQuery,
    membersQuery.data,
    selectedInviteeEmails,
    selectedInviteeIds,
  ]);

  const isMutating =
    shareMutation.isPending
    || shareManyMutation.isPending
    || revokeMutation.isPending
    || updateInvitationMutation.isPending
    || revokeInvitationMutation.isPending
    || updateAccessSettingsMutation.isPending;

  const canInvite =
    canManageAccess
    && !isArchived
    && selectedInvitees.length > 0
    && !shareManyMutation.isPending;

  const addInvitee = (invitee: InviteSuggestion) => {
    setSelectedInvitees((invitees) => [
      ...invitees,
      {
        userId: invitee.userId,
        email: invitee.email,
        displayName: invitee.displayName,
      },
    ]);
    setInviteQuery('');
  };

  const removeInvitee = (inviteeId: string) => {
    setSelectedInvitees((invitees) =>
      invitees.filter((invitee) => getInviteeId(invitee) !== inviteeId));
  };

  const removeLastInvitee = () => {
    setSelectedInvitees((invitees) => invitees.slice(0, -1));
  };

  const inviteSelected = async () => {
    if (!canInvite) {
      return;
    }

    const result = await shareManyMutation.mutateAsync({
      grants: selectedInvitees.map((invitee) => ({
        userId: invitee.userId,
        email: invitee.userId ? undefined : invitee.email,
        permission: invitePermission,
      })),
    });
    setSelectedInvitees([]);
    setInviteQuery('');
    setIsInviteMode(false);
    if (result.failed.length > 0) {
      toast(`${result.collaborators.length} invited, ${result.failed.length} failed`);
      return;
    }

    toast('Document shared');
  };

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
    if (
      accessSettingsQuery.data?.workspace_member_permission === permission
      || isMutating
    ) {
      return;
    }

    updateAccessSettingsMutation.mutate(permission, {
      onSuccess: () => {
        toast(permission ? 'Workspace access updated' : 'Workspace access restricted');
      },
    });
  };

  return {
    addInvitee,
    canInvite,
    collaborators: collaboratorsQuery.data ?? [],
    currentUserId: currentUserQuery.data?.id,
    invitePermission,
    inviteQuery,
    inviteSelected,
    invitations: invitationsQuery.data ?? [],
    isInviteMode,
    isMutating,
    inviteSuggestions,
    ownerMember,
    removeInvitee,
    removeLastInvitee,
    revokeAccess,
    revokeInvitation,
    selectedInvitees,
    setInviteMode: setIsInviteMode,
    setInvitePermission,
    setInviteQuery,
    updateWorkspaceMemberPermission,
    updateInvitationPermission,
    updatePermission,
    workspaceMemberPermission:
      accessSettingsQuery.data?.workspace_member_permission ??
      document.access?.workspace_member_permission,
    workspaceName: workspaceQuery.data?.name ?? workspaceSlug,
  };
}

function getInviteeId(invitee: SelectedInvitee): string {
  return invitee.userId ?? invitee.email.toLowerCase();
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
