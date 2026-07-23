'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useCurrentUserQuery } from '@/domains/auth/hooks/use-current-user-query';
import {
  documentCollaboratorsQueryOptions,
  documentAccessSettingsQueryOptions,
  documentKeys,
  revokeDocumentAccess,
  shareDocument,
  shareDocuments,
  updateDocumentAccessSettings,
  type Document,
  type DocumentAccessGrantPermission,
  type DocumentCollaborator,
  type DocumentOwnerUser,
} from '@/domains/document';
import { favoriteKeys } from '@/domains/favorite';
import { searchKeys } from '@/domains/search';
import {
  workspaceMemberListQueryOptions,
  workspaceDetailQueryOptions,
  type WorkspaceMember,
} from '@/domains/workspace';

export type SelectedInvitee = {
  userId: string;
  email: string;
  displayName?: string;
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
        permission: DocumentAccessGrantPermission;
        userId: string;
      }>;
    }) =>
      shareDocuments(document.id, {
        grants: input.grants.map((grant) => ({
          user_id: grant.userId,
          permission: grant.permission,
        })),
      }),
    onSuccess: async (result) => {
      await invalidateSharingState();
      upsertCollaborators(result.collaborators);
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
    () => new Set(selectedInvitees.map((invitee) => invitee.userId)),
    [selectedInvitees],
  );
  const memberSuggestions = useMemo(() => {
    const normalizedQuery = inviteQuery.trim().toLowerCase();

    if (!normalizedQuery || !membersQuery.data) {
      return [];
    }

    return membersQuery.data
      .filter((member) =>
        member.user_id !== document.owner_user_id
        && !selectedInviteeIds.has(member.user_id)
        && !collaboratorsByUserId.has(member.user_id)
        && (
          member.email.toLowerCase().includes(normalizedQuery)
          || member.display_name?.toLowerCase().includes(normalizedQuery)
        ))
      .slice(0, 5);
  }, [
    collaboratorsByUserId,
    document.owner_user_id,
    inviteQuery,
    membersQuery.data,
    selectedInviteeIds,
  ]);

  const isMutating =
    shareMutation.isPending
    || shareManyMutation.isPending
    || revokeMutation.isPending
    || updateAccessSettingsMutation.isPending;
  const canInvite =
    canManageAccess
    && !isArchived
    && selectedInvitees.length > 0
    && !shareManyMutation.isPending;

  const addInvitee = (member: WorkspaceMember) => {
    setSelectedInvitees((invitees) => [
      ...invitees,
      {
        userId: member.user_id,
        email: member.email,
        displayName: member.display_name,
      },
    ]);
    setInviteQuery('');
  };

  const removeInvitee = (userId: string) => {
    setSelectedInvitees((invitees) =>
      invitees.filter((invitee) => invitee.userId !== userId));
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
    isInviteMode,
    isMutating,
    memberSuggestions,
    ownerMember,
    removeInvitee,
    removeLastInvitee,
    revokeAccess,
    selectedInvitees,
    setInviteMode: setIsInviteMode,
    setInvitePermission,
    setInviteQuery,
    updateWorkspaceMemberPermission,
    updatePermission,
    workspaceMemberPermission:
      accessSettingsQuery.data?.workspace_member_permission ??
      document.access?.workspace_member_permission,
    workspaceName: workspaceQuery.data?.name ?? workspaceSlug,
  };
}
