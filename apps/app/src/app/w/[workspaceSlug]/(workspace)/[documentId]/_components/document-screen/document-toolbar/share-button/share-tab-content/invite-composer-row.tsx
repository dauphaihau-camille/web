import type { DocumentAccessGrantPermission } from '@/domains/document';
import { Button } from '@shared/components/ui/button';

import type { SelectedInvitee } from '../_hooks/use-invite-composer';
import { InviteInput } from './invite-panel/invite-input/invite-input';

export function InviteComposerRow({
  canInvite,
  canManageAccess,
  disabled,
  invitePermission,
  inviteQuery,
  isArchived,
  selectedInvitees,
  onInvite,
  onAddActiveInviteSuggestion,
  onInvitePermissionChange,
  onInviteQueryChange,
  onRemoveInvitee,
  onRemoveLastInvitee,
}: {
  canInvite: boolean;
  canManageAccess: boolean;
  disabled: boolean;
  invitePermission: DocumentAccessGrantPermission;
  inviteQuery: string;
  isArchived: boolean;
  selectedInvitees: SelectedInvitee[];
  onInvite: () => void;
  onAddActiveInviteSuggestion: () => boolean;
  onInvitePermissionChange: (permission: DocumentAccessGrantPermission) => void;
  onInviteQueryChange: (query: string) => void;
  onRemoveInvitee: (userId: string) => void;
  onRemoveLastInvitee: () => void;
}) {
  return (
    <div className="flex gap-2">
      <InviteInput
        canManageAccess={canManageAccess}
        invitePermission={invitePermission}
        inviteQuery={inviteQuery}
        isArchived={isArchived}
        selectedInvitees={selectedInvitees}
        onAddActiveInviteSuggestion={onAddActiveInviteSuggestion}
        onInvitePermissionChange={onInvitePermissionChange}
        onInviteQueryChange={onInviteQueryChange}
        onRemoveInvitee={onRemoveInvitee}
        onRemoveLastInvitee={onRemoveLastInvitee}
      />
      <Button
        disabled={disabled || !canInvite}
        onClick={onInvite}
        className="rounded-sm"
      >
        Invite
      </Button>
    </div>
  );
}
