'use client';

import { useDebounce } from 'ahooks';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import type {
  DocumentAccessGrantPermission,
  DocumentCollaborator,
  DocumentInvitation,
} from '@/domains/document';
import {
  workspaceMemberSearchQueryOptions,
} from '@/domains/workspace';

export type SelectedInvitee = {
  email: string;
  displayName?: string;
  userId?: string;
};

export type InviteSuggestion = {
  displayName?: string;
  avatar?: string;
  email: string;
  id: string;
  source: 'workspace' | 'external';
  userId?: string;
};

export type InviteSuggestionGroups = {
  external: InviteSuggestion[];
  workspace: InviteSuggestion[];
};

type UseInviteComposerOptions = {
  canManageAccess: boolean;
  collaborators: DocumentCollaborator[];
  invitations: DocumentInvitation[];
  isArchived: boolean;
  isInvitePending: boolean;
  ownerUserId: string;
  workspaceId: string;
};

export function useInviteComposer({
  canManageAccess,
  collaborators,
  invitations,
  isArchived,
  isInvitePending,
  ownerUserId,
  workspaceId,
}: UseInviteComposerOptions) {
  const [inviteQuery, setInviteQuery] = useState('');
  const [selectedInvitees, setSelectedInvitees] = useState<SelectedInvitee[]>([]);
  const [invitePermission, setInvitePermission] =
    useState<DocumentAccessGrantPermission>('manage');
  const normalizedQuery = inviteQuery.trim();
  const debouncedQuery = useDebounce(normalizedQuery, { wait: 250 });

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

  const workspaceMembersQuery = useQuery({
    ...workspaceMemberSearchQueryOptions(workspaceId, {
      query: debouncedQuery || undefined,
      limit: debouncedQuery ? 5 : 3,
    }),
    enabled: canManageAccess && !isArchived,
  });

  const inviteSuggestions = useMemo<InviteSuggestionGroups>(() => {
    const normalizedInviteQuery = normalizedQuery.toLowerCase();

    const workspaceSuggestions: InviteSuggestion[] = (workspaceMembersQuery.data ?? [])
      .filter((member) =>
        member.user_id !== ownerUserId
        && !selectedInviteeIds.has(member.user_id)
        && !selectedInviteeEmails.has(member.email.toLowerCase())
        && !invitedEmails.has(member.email.toLowerCase())
        && !collaboratorsByUserId.has(member.user_id)
        && (!normalizedInviteQuery || (
          member.email.toLowerCase().includes(normalizedInviteQuery)
          || member.display_name?.toLowerCase().includes(normalizedInviteQuery)
        )))
      .slice(0, debouncedQuery ? 5 : 3)
      .map((member) => ({
        displayName: member.display_name,
        avatar: member.avatar,
        email: member.email,
        id: member.user_id,
        source: 'workspace',
        userId: member.user_id,
      }));

    if (workspaceSuggestions.length > 0) {
      return {
        external: [],
        workspace: workspaceSuggestions,
      };
    }

    if (!normalizedInviteQuery) {
      return {
        external: [],
        workspace: [],
      };
    }

    const externalSuggestions = getDefaultEmailSuggestions(normalizedInviteQuery)
      .filter((email) =>
        !selectedInviteeEmails.has(email)
        && !invitedEmails.has(email))
      .map((email) => ({
        email,
        id: email,
        source: 'external' as const,
      }));

    return {
      external: externalSuggestions,
      workspace: workspaceSuggestions,
    };
  }, [
    collaboratorsByUserId,
    invitedEmails,
    inviteQuery,
    ownerUserId,
    workspaceMembersQuery.data,
    selectedInviteeEmails,
    selectedInviteeIds,
    debouncedQuery,
    normalizedQuery,
  ]);

  const canInvite =
    canManageAccess
    && !isArchived
    && selectedInvitees.length > 0
    && !isInvitePending;

  const activeInviteSuggestion = inviteSuggestions.external[0];

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

  const addActiveInviteSuggestion = () => {
    if (!activeInviteSuggestion) {
      return false;
    }

    addInvitee(activeInviteSuggestion);
    return true;
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
    activeInviteSuggestionId: activeInviteSuggestion?.id,
    addActiveInviteSuggestion,
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
