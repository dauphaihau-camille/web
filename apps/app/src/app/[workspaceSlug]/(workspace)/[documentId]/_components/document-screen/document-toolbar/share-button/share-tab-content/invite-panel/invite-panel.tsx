import { InviteComposerRow } from '../invite-composer-row';
import { useShareTabContext } from '../share-tab-context';
import { InviteSuggestions } from './invite-suggestions';

export function InvitePanel() {
  const { invitePanel } = useShareTabContext();
  const { actions, state } = invitePanel;

  return (
    <div className="">
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

      <div className="mt-4">
        <InviteSuggestions
          inviteQuery={state.inviteQuery}
          suggestions={state.inviteSuggestions}
          onAddInvitee={actions.addInvitee}
        />
      </div>
    </div>
  );
}
