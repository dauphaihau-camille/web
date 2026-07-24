'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useCurrentUserQuery } from '@/domains/auth/hooks/use-current-user-query';
import {
  documentAccessSettingsQueryOptions,
  documentCollaboratorsQueryOptions,
  documentInvitationsQueryOptions,
  type Document,
  type DocumentOwnerUser,
} from '@/domains/document';
import {
  workspaceDetailQueryOptions,
  workspaceMemberListQueryOptions,
} from '@/domains/workspace';

type UseShareAccessQueriesOptions = {
  canManageAccess: boolean;
  document: Document;
  workspaceSlug: string;
};

export function useShareAccessQueries({
  canManageAccess,
  document,
  workspaceSlug,
}: UseShareAccessQueriesOptions) {
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

  return {
    accessSettingsQuery,
    collaborators: collaboratorsQuery.data ?? [],
    currentUserId: currentUserQuery.data?.id,
    invitations: invitationsQuery.data ?? [],
    members: membersQuery.data ?? [],
    ownerMember,
    workspaceMemberPermission:
      accessSettingsQuery.data?.workspace_member_permission ??
      document.access?.workspace_member_permission,
    workspaceName: workspaceQuery.data?.name ?? workspaceSlug,
  };
}
