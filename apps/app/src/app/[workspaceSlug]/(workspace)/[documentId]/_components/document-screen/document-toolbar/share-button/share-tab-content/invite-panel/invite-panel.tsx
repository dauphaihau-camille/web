import { ChevronLeftIcon } from 'lucide-react';

import type { DocumentAccessGrantPermission } from '@/domains/document';
import { Button } from '@shared/components/ui/button';
import type { InviteSuggestion, SelectedInvitee } from '../../_hooks/use-share-tab';
import { InviteInput } from './invite-input/invite-input';
import { InviteSuggestions } from './invite-suggestions';

export function InvitePanel({
  canInvite,
  canManageAccess,
  invitePermission,
  inviteQuery,
  isArchived,
  inviteSuggestions,
  selectedInvitees,
  onAddInvitee,
  onBack,
  onInvite,
  onInvitePermissionChange,
  onInviteQueryChange,
  onRemoveInvitee,
  onRemoveLastInvitee,
}: {
  canInvite: boolean;
  canManageAccess: boolean;
  invitePermission: DocumentAccessGrantPermission;
  inviteQuery: string;
  isArchived: boolean;
  inviteSuggestions: InviteSuggestion[];
  selectedInvitees: SelectedInvitee[];
  onAddInvitee: (invitee: InviteSuggestion) => void;
  onBack: () => void;
  onInvite: () => void;
  onInvitePermissionChange: (permission: DocumentAccessGrantPermission) => void;
  onInviteQueryChange: (query: string) => void;
  onRemoveInvitee: (userId: string) => void;
  onRemoveLastInvitee: () => void;
}) {
  return (
    <div className="">
      <div className="-mx-4 -mt-4 flex h-12 items-center gap-1 px-4">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to sharing"
          onClick={onBack}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <p className="text-sm font-semibold">Invite</p>
      </div>

      <div className="flex gap-2">
        <InviteInput
          canManageAccess={canManageAccess}
          invitePermission={invitePermission}
          inviteQuery={inviteQuery}
          isArchived={isArchived}
          selectedInvitees={selectedInvitees}
          onInvitePermissionChange={onInvitePermissionChange}
          onInviteQueryChange={onInviteQueryChange}
          onRemoveInvitee={onRemoveInvitee}
          onRemoveLastInvitee={onRemoveLastInvitee}
        />
        <Button
          disabled={!canInvite}
          onClick={onInvite}
          className="rounded-sm"
        >
          Invite
        </Button>
      </div>

      <div className="mt-4">
        <InviteSuggestions
          suggestions={inviteSuggestions}
          onAddInvitee={onAddInvitee}
        />
      </div>
    </div>
  );
}
