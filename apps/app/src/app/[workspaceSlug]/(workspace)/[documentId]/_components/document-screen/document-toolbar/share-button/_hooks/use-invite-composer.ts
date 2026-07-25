'use client';

import { useMemo, useState } from 'react';

import type {
  DocumentAccessGrantPermission,
  DocumentCollaborator,
  DocumentInvitation,
} from '@/domains/document';
import type { WorkspaceMember } from '@/domains/workspace';

export type SelectedInvitee = {
  email: string;
  displayName?: string;
  userId?: string;
};

export type InviteSuggestion = {
  displayName?: string;
  email: string;
  id: string;
  source: 'workspace' | 'external';
  userId?: string;
};

type UseInviteComposerOptions = {
  canManageAccess: boolean;
  collaborators: DocumentCollaborator[];
  invitations: DocumentInvitation[];
  isArchived: boolean;
  isInvitePending: boolean;
  members: WorkspaceMember[];
  ownerUserId: string;
};

export function useInviteComposer({
  canManageAccess,
  collaborators,
  invitations,
  isArchived,
  isInvitePending,
  members,
  ownerUserId,
}: UseInviteComposerOptions) {
  const [inviteQuery, setInviteQuery] = useState('');
  const [selectedInvitees, setSelectedInvitees] = useState<SelectedInvitee[]>([]);
  const [invitePermission, setInvitePermission] =
    useState<DocumentAccessGrantPermission>('manage');

  const collaboratorsByUserId = useMemo(
    () => new Map(
      collaborators.map((collaborator) => [
        collaborator.user.id,
        collaborator,
      ]),
    ),
    [collaborators],
  );

  const selectedInviteeIds = useMemo(
    () => new Set(selectedInvitees.flatMap((invitee) =>
      invitee.userId ? [invitee.userId] : [])),
    [selectedInvitees],
  );

  const selectedInviteeEmails = useMemo(
    () => new Set(selectedInvitees.map((invitee) => invitee.email.toLowerCase())),
    [selectedInvitees],
  );

  const invitedEmails = useMemo(
    () => new Set(invitations.map((invitation) => invitation.email.toLowerCase())),
    [invitations],
  );

  const inviteSuggestions = useMemo(() => {
    const normalizedQuery = inviteQuery.trim().toLowerCase();

    const workspaceSuggestions: InviteSuggestion[] = members
      .filter((member) =>
        member.user_id !== ownerUserId
        && !selectedInviteeIds.has(member.user_id)
        && !selectedInviteeEmails.has(member.email.toLowerCase())
        && !invitedEmails.has(member.email.toLowerCase())
        && !collaboratorsByUserId.has(member.user_id)
        && (!normalizedQuery || (
          member.email.toLowerCase().includes(normalizedQuery)
          || member.display_name?.toLowerCase().includes(normalizedQuery)
        )))
      .slice(0, normalizedQuery ? 5 : 3)
      .map((member) => ({
        displayName: member.display_name,
        email: member.email,
        id: member.user_id,
        source: 'workspace',
        userId: member.user_id,
      }));

    if (workspaceSuggestions.length > 0) {
      return workspaceSuggestions;
    }

    if (!normalizedQuery) {
      return [];
    }

    return getDefaultEmailSuggestions(normalizedQuery)
      .filter((email) =>
        !selectedInviteeEmails.has(email)
        && !invitedEmails.has(email))
      .map((email) => ({
        email,
        id: email,
        source: 'external' as const,
      }));
  }, [
    collaboratorsByUserId,
    invitedEmails,
    inviteQuery,
    members,
    ownerUserId,
    selectedInviteeEmails,
    selectedInviteeIds,
  ]);

  const canInvite =
    canManageAccess
    && !isArchived
    && selectedInvitees.length > 0
    && !isInvitePending;

  const addInvitee = (invitee: InviteSuggestion) => {
    setSelectedInvitees((invitees) => [
      ...invitees,
      {
        userId: invitee.userId,
        email: invitee.email,
        displayName: invitee.displayName,
      },
    ]);
    setInviteQuery('');
  };

  const removeInvitee = (inviteeId: string) => {
    setSelectedInvitees((invitees) =>
      invitees.filter((invitee) => getInviteeId(invitee) !== inviteeId));
  };

  const removeLastInvitee = () => {
    setSelectedInvitees((invitees) => invitees.slice(0, -1));
  };

  const resetInvitees = () => {
    setSelectedInvitees([]);
    setInviteQuery('');
  };

  return {
    addInvitee,
    canInvite,
    invitePermission,
    inviteQuery,
    inviteSuggestions,
    removeInvitee,
    removeLastInvitee,
    resetInvitees,
    selectedInvitees,
    setInvitePermission,
    setInviteQuery,
  };
}

function getInviteeId(invitee: SelectedInvitee): string {
  return invitee.userId ?? invitee.email.toLowerCase();
}

const DEFAULT_INVITE_DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com'];

function getDefaultEmailSuggestions(query: string): string[] {
  const [localPart, domainFragment = ''] = query.split('@');
  const normalizedLocalPart = localPart.trim().toLowerCase();
  const normalizedDomainFragment = domainFragment.trim().toLowerCase();

  if (!normalizedLocalPart) {
    return [];
  }

  const defaultSuggestions = DEFAULT_INVITE_DOMAINS
    .filter((domain) => domain.startsWith(normalizedDomainFragment))
    .map((domain) => `${normalizedLocalPart}@${domain}`);

  if (defaultSuggestions.length > 0) {
    return defaultSuggestions;
  }

  return isEmail(query) ? [query] : [];
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
