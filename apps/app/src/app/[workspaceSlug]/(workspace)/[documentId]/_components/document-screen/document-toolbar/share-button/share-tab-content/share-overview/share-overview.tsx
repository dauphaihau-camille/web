import { GeneralAccessRow } from './general-access-row';
import { MemberAccessRow } from './member-access-row';
import { getShareAccessRows, type ShareAccessRow } from './share-access-rows';
import { InviteComposerRow } from '../invite-composer-row';
import { useShareTabContext } from '../share-tab-context';
import {
  getPermissionLabel,
} from '../share-permissions';
import { ShareFooter } from './share-footer';

export function ShareOverview() {
  const { copyLink, overview } = useShareTabContext();
  const { actions, state } = overview;

  const rows = getShareAccessRows({
    collaborators: state.collaborators,
    currentUserId: state.currentUserId,
    invitations: state.invitations,
    ownerMember: state.ownerMember,
  });

  const renderRow = (row: ShareAccessRow) => {
    if (row.isOwner) {
      return (
        <MemberAccessRow
          key={row.id}
          name={row.name}
          email={row.email}
          isCurrentUser={row.id === state.currentUserId}
          permissionLabel="Full access"
          disabled
        />
      );
    }

    if ('collaborator' in row) {
      return (
        <MemberAccessRow
          key={row.collaborator.id}
          accessSourceLabel={row.collaborator.access_source === 'inherited'
            ? 'inherited access'
            : undefined}
          name={row.name}
          email={row.email}
          isCurrentUser={row.id === state.currentUserId}
          documentTitle={
            row.collaborator.access_source === 'inherited'
              ? row.collaborator.inherited_from_document_title
              : state.documentTitle
          }
          permission={row.collaborator.permission}
          permissionLabel={getPermissionLabel(row.collaborator.permission)}
          disabled={!state.canManageAccess || state.isArchived || state.isMutating}
          onPermissionChange={(permission) =>
            actions.updatePermission(row.collaborator, permission)}
          onRevoke={row.collaborator.access_source === 'inherited'
            ? undefined
            : () => actions.revokeAccess(row.collaborator)}
        />
      );
    }

    return (
      <MemberAccessRow
        key={row.invitation.id}
        name={row.name}
        email={row.email}
        isCurrentUser={false}
        permission={row.invitation.permission}
        permissionLabel={getPermissionLabel(row.invitation.permission)}
        statusLabel="Invited"
        disabled={!state.canManageAccess || state.isArchived || state.isMutating}
        onPermissionChange={(permission) =>
          actions.updateInvitationPermission(row.invitation, permission)}
        onRevoke={() => actions.revokeInvitation(row.invitation)}
      />
    );
  };

  return (
    <div className="space-y-4">
      <InviteComposerRow
        canInvite={state.canInvite}
        canManageAccess={state.canManageAccess}
        disabled={!state.canManageAccess || state.isArchived}
        invitePermission={state.invitePermission}
        inviteQuery={state.inviteQuery}
        isArchived={state.isArchived}
        selectedInvitees={state.selectedInvitees}
        onInvite={actions.invite}
        onInvitePermissionChange={actions.setInvitePermission}
        onInviteQueryChange={actions.setInviteQuery}
        onRemoveInvitee={actions.removeInvitee}
        onRemoveLastInvitee={actions.removeLastInvitee}
      />

      <div className="space-y-3">
        {rows.map(renderRow)}
      </div>

      <GeneralAccessRow
        disabled={!state.canManageAccess || state.isArchived || state.isMutating}
        workspaceMemberPermission={state.workspaceMemberPermission}
        workspaceName={state.workspaceName}
        onWorkspaceMemberPermissionChange={actions.updateWorkspaceMemberPermission}
      />

      <ShareFooter onCopyLink={copyLink} />
    </div>
  );
}
