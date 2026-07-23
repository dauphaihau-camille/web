import type { DocumentAccessGrantPermission } from '@/domains/document';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@shared/components/ui/input-group';
import type { SelectedInvitee } from '../../../_hooks/use-share-tab';
import { InviteeBadge } from './invitee-badge';
import { PermissionDropdown } from './permission-dropdown';

export function InviteInput({
  canManageAccess,
  invitePermission,
  inviteQuery,
  isArchived,
  selectedInvitees,
  onInvitePermissionChange,
  onInviteQueryChange,
  onRemoveInvitee,
  onRemoveLastInvitee,
}: {
  canManageAccess: boolean;
  invitePermission: DocumentAccessGrantPermission;
  inviteQuery: string;
  isArchived: boolean;
  selectedInvitees: SelectedInvitee[];
  onInvitePermissionChange: (permission: DocumentAccessGrantPermission) => void;
  onInviteQueryChange: (query: string) => void;
  onRemoveInvitee: (userId: string) => void;
  onRemoveLastInvitee: () => void;
}) {
  const hasSelectedInvitees = selectedInvitees.length > 0;
  const hasInviteQuery = Boolean(inviteQuery.trim());

  return (
    <InputGroup className="min-h-8 flex-1 rounded-sm">
      {hasSelectedInvitees
        ? (
          <InputGroupAddon
            align="block-start"
            className="flex items-start justify-between gap-2 border-b-0 pb-0 pt-0"
          >
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {selectedInvitees.map((invitee) => (
                <InviteeBadge
                  key={invitee.userId}
                  email={invitee.email}
                  onRemove={() => onRemoveInvitee(invitee.userId)}
                />
              ))}
            </div>
            <PermissionDropdown
              permission={invitePermission}
              disabled={!canManageAccess || isArchived}
              onChange={onInvitePermissionChange}
            />
          </InputGroupAddon>
        )
        : null}
      <InputGroupInput
        autoFocus
        value={inviteQuery}
        disabled={!canManageAccess || isArchived}
        placeholder={selectedInvitees.length > 0 ? 'Add another person' : 'Email or name'}
        className="h-8 text-sm"
        onChange={(event) => onInviteQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === 'Backspace'
            && inviteQuery.length === 0
            && selectedInvitees.length > 0
          ) {
            onRemoveLastInvitee();
          }
        }}
      />
      {!hasSelectedInvitees && hasInviteQuery
        ? (
          <InputGroupAddon align="inline-end" className="py-0">
            <PermissionDropdown
              permission={invitePermission}
              disabled={!canManageAccess || isArchived}
              onChange={onInvitePermissionChange}
            />
          </InputGroupAddon>
        )
        : null}
    </InputGroup>
  );
}
