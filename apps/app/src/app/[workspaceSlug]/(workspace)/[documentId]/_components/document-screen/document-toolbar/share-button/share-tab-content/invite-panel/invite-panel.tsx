import { ChevronLeftIcon } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { useShareTabContext } from '../share-tab-context';
import { InviteInput } from './invite-input/invite-input';
import { InviteSuggestions } from './invite-suggestions';

export function InvitePanel() {
  const { invitePanel } = useShareTabContext();
  const { actions, state } = invitePanel;

  return (
    <div className="">
      <div className="-mx-4 -mt-4 flex h-12 items-center gap-1 px-4">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to sharing"
          onClick={actions.back}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <p className="text-sm font-semibold">Invite</p>
      </div>

      <div className="flex gap-2">
        <InviteInput
          canManageAccess={state.canManageAccess}
          invitePermission={state.invitePermission}
          inviteQuery={state.inviteQuery}
          isArchived={state.isArchived}
          selectedInvitees={state.selectedInvitees}
          onInvitePermissionChange={actions.setInvitePermission}
          onInviteQueryChange={actions.setInviteQuery}
          onRemoveInvitee={actions.removeInvitee}
          onRemoveLastInvitee={actions.removeLastInvitee}
        />
        <Button
          disabled={!state.canInvite}
          onClick={actions.invite}
          className="rounded-sm"
        >
          Invite
        </Button>
      </div>

      <div className="mt-4">
        <InviteSuggestions
          suggestions={state.inviteSuggestions}
          onAddInvitee={actions.addInvitee}
        />
      </div>
    </div>
  );
}
