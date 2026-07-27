import {
  useMemo,
  useState,
} from 'react';

import type {
  DocumentAccessGrantPermission,
  DocumentCollaborator,
  DocumentInvitation,
} from '@/domains/document';

import { MemberAccessRow } from '../share-overview/member-access-row';
import { getPermissionLabel } from '../share-permissions';
import { InviteComposerRow } from '../invite-composer-row';
import { getShareAccessRows, type ShareAccessRow } from '../share-overview/share-access-rows';
import { useShareTabContext } from '../share-tab-context';
import { InviteSuggestions } from './invite-suggestions';

export function InvitePanel() {
  const { invitePanel, overview } = useShareTabContext();
  const { actions, state } = invitePanel;
  const { actions: overviewActions, state: overviewState } = overview;
  const [isDefaultSuggestionSuppressed, setIsDefaultSuggestionSuppressed] = useState(false);
  const activeSuggestionId = isDefaultSuggestionSuppressed
    ? undefined
    : state.activeInviteSuggestionId;

  const handleInviteQueryChange = (query: string) => {
    setIsDefaultSuggestionSuppressed(false);
    actions.setInviteQuery(query);
  };

  const accessRows = useMemo(() => {
    const query = state.inviteQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const rows = getShareAccessRows({
      collaborators: overviewState.collaborators,
      currentUserId: overviewState.currentUserId,
      invitations: overviewState.invitations,
      ownerMember: overviewState.ownerMember,
    });

    return rows.filter((row) =>
      row.name.toLowerCase().includes(query)
      || row.email.toLowerCase().includes(query));
  }, [
    overviewState.collaborators,
    overviewState.currentUserId,
    overviewState.invitations,
    overviewState.ownerMember,
    state.inviteQuery,
  ]);

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
        onAddActiveInviteSuggestion={() =>
          isDefaultSuggestionSuppressed ? false : actions.addActiveInviteSuggestion()}
        onInvitePermissionChange={actions.setInvitePermission}
        onInviteQueryChange={handleInviteQueryChange}
        onRemoveInvitee={actions.removeInvitee}
        onRemoveLastInvitee={actions.removeLastInvitee}
      />

      {accessRows.length > 0
        ? (
          <section className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">
              Already invited
            </p>
            <div className="space-y-2">
              {accessRows.map((row) => renderAccessRow({
                row,
                currentUserId: overviewState.currentUserId,
                documentTitle: overviewState.documentTitle,
                canManageAccess: overviewState.canManageAccess,
                isArchived: overviewState.isArchived,
                isMutating: overviewState.isMutating,
                actions: overviewActions,
                onPointerEnter: () => setIsDefaultSuggestionSuppressed(true),
              }))}
            </div>
          </section>
        )
        : null}

      <div>
        <InviteSuggestions
          activeSuggestionId={activeSuggestionId}
          inviteQuery={state.inviteQuery}
          suggestions={state.inviteSuggestions}
          onAddInvitee={actions.addInvitee}
          onSuggestionPointerEnter={(suggestion) => {
            if (suggestion.id !== state.activeInviteSuggestionId) {
              setIsDefaultSuggestionSuppressed(true);
            }
          }}
        />
      </div>
    </div>
  );
}

function renderAccessRow({
  row,
  currentUserId,
  documentTitle,
  canManageAccess,
  isArchived,
  isMutating,
  onPointerEnter,
  actions,
}: {
  row: ShareAccessRow;
  currentUserId?: string;
  documentTitle: string;
  canManageAccess: boolean;
  isArchived: boolean;
  isMutating: boolean;
  onPointerEnter: () => void;
  actions: {
    revokeAccess: (collaborator: DocumentCollaborator) => void;
    revokeInvitation: (invitation: DocumentInvitation) => void;
    updateInvitationPermission: (
      invitation: DocumentInvitation,
      permission: DocumentAccessGrantPermission,
    ) => void;
    updatePermission: (
      collaborator: DocumentCollaborator,
      permission: DocumentAccessGrantPermission,
    ) => void;
  };
}) {
  if (row.isOwner) {
    return (
      <div key={row.id} onPointerEnter={onPointerEnter}>
        <MemberAccessRow
          avatar={row.avatar}
          name={row.name}
          email={row.email}
          isCurrentUser={row.id === currentUserId}
          permissionLabel="Full access"
          disabled
        />
      </div>
    );
  }

  if ('collaborator' in row) {
    return (
      <div key={row.collaborator.id} onPointerEnter={onPointerEnter}>
        <MemberAccessRow
          accessSourceLabel={row.collaborator.access_source === 'inherited'
            ? 'inherited access'
            : undefined}
          avatar={row.avatar}
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
          onPermissionChange={(permission) =>
            actions.updatePermission(row.collaborator, permission)}
          onRevoke={row.collaborator.access_source === 'inherited'
            ? undefined
            : () => actions.revokeAccess(row.collaborator)}
        />
      </div>
    );
  }

  return (
    <div key={row.invitation.id} onPointerEnter={onPointerEnter}>
      <MemberAccessRow
        name={row.name}
        email={row.email}
        isCurrentUser={false}
        permission={row.invitation.permission}
        permissionLabel={getPermissionLabel(row.invitation.permission)}
        statusLabel="Invited"
        disabled={!canManageAccess || isArchived || isMutating}
        onPermissionChange={(permission) =>
          actions.updateInvitationPermission(row.invitation, permission)}
        onRevoke={() => actions.revokeInvitation(row.invitation)}
      />
    </div>
  );
}
