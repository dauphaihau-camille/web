import type {
  DocumentAccessGrantPermission,
  DocumentCollaborator,
  DocumentOwnerUser,
} from '@/domains/document';
import { GeneralAccessRow } from './general-access-row';
import { InviteEntryPoint } from './invite-entry-point';
import { MemberAccessRow } from './member-access-row';
import {
  getPermissionLabel,
} from '../share-permissions';
import { ShareFooter } from './share-footer';

type ShareAccessRow =
  | {
    email: string;
    id: string;
    isOwner: true;
    name: string;
  }
  | {
    collaborator: DocumentCollaborator;
    email: string;
    id: string;
    isOwner: false;
    name: string;
  };

export function ShareOverview({
  canManageAccess,
  collaborators,
  currentUserId,
  documentTitle,
  isArchived,
  isMutating,
  ownerMember,
  workspaceMemberPermission,
  workspaceName,
  onCopyLink,
  onOpenInvite,
  onPermissionChange,
  onRevoke,
  onWorkspaceMemberPermissionChange,
}: {
  canManageAccess: boolean;
  collaborators: DocumentCollaborator[];
  currentUserId?: string;
  documentTitle: string;
  isArchived: boolean;
  isMutating: boolean;
  ownerMember?: DocumentOwnerUser;
  workspaceMemberPermission?: DocumentAccessGrantPermission;
  workspaceName: string;
  onCopyLink: () => void | Promise<void>;
  onOpenInvite: () => void;
  onPermissionChange: (
    collaborator: DocumentCollaborator,
    permission: DocumentAccessGrantPermission,
  ) => void;
  onRevoke: (collaborator: DocumentCollaborator) => void;
  onWorkspaceMemberPermissionChange: (
    permission: DocumentAccessGrantPermission | undefined,
  ) => void;
}) {
  const rows: ShareAccessRow[] = [];

  if (ownerMember) {
    rows.push({
      email: ownerMember.email,
      id: ownerMember.id,
      isOwner: true,
      name: ownerMember.display_name ?? ownerMember.email,
    });
  }

  for (const collaborator of collaborators) {
    rows.push({
      collaborator,
      email: collaborator.user.email,
      id: collaborator.user.id,
      isOwner: false,
      name: collaborator.user.display_name ?? collaborator.user.email,
    });
  }

  rows.sort((left, right) => {
    if (left.id === currentUserId) {
      return -1;
    }

    if (right.id === currentUserId) {
      return 1;
    }

    return 0;
  });

  return (
    <div className="space-y-4">
      <InviteEntryPoint
        disabled={!canManageAccess || isArchived}
        onOpenInvite={onOpenInvite}
      />

      <div className="space-y-3">
        {rows.map((row) =>
          row.isOwner
            ? (
              <MemberAccessRow
                key={row.id}
                name={row.name}
                email={row.email}
                isCurrentUser={row.id === currentUserId}
                permissionLabel="Full access"
                disabled
              />
            )
            : (
              <MemberAccessRow
                key={row.collaborator.id}
                accessSourceLabel={row.collaborator.access_source === 'inherited'
                  ? 'inherited access'
                  : undefined}
                name={row.name}
                email={row.email}
                isCurrentUser={row.id === currentUserId}
                documentTitle={
                  row.collaborator.access_source === 'inherited'
                    ? row.collaborator.inherited_from_document_title
                    : documentTitle
                }
                permission={row.collaborator.permission}
                permissionLabel={getPermissionLabel(row.collaborator.permission)}
                disabled={!canManageAccess || isArchived || isMutating}
                onPermissionChange={(permission) => onPermissionChange(row.collaborator, permission)}
                onRevoke={row.collaborator.access_source === 'inherited'
                  ? undefined
                  : () => onRevoke(row.collaborator)}
              />
            ))}
      </div>

      <GeneralAccessRow
        disabled={!canManageAccess || isArchived || isMutating}
        workspaceMemberPermission={workspaceMemberPermission}
        workspaceName={workspaceName}
        onWorkspaceMemberPermissionChange={onWorkspaceMemberPermissionChange}
      />

      <ShareFooter onCopyLink={onCopyLink} />
    </div>
  );
}
