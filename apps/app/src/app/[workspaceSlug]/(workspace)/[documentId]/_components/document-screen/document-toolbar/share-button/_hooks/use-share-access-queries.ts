'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserQuery } from '@/domains/auth/hooks/use-current-user-query';
import {
  documentAccessSettingsQueryOptions,
  documentCollaboratorsQueryOptions,
  documentInvitationsQueryOptions,
  type Document,
} from '@/domains/document';
import {
  workspaceDetailQueryOptions,
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

  return {
    accessSettingsQuery,
    collaborators: collaboratorsQuery.data ?? [],
    currentUserId: currentUserQuery.data?.id,
    invitations: invitationsQuery.data ?? [],
    ownerMember: document.owner_user,
    workspaceMemberPermission:
      accessSettingsQuery.data?.workspace_member_permission ??
      document.access?.workspace_member_permission,
    workspaceName: workspaceQuery.data?.name ?? workspaceSlug,
  };
}
