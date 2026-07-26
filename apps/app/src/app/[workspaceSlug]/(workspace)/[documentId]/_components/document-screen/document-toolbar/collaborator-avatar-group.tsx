'use client';

import { useQuery } from '@tanstack/react-query';

import type { Document, DocumentCollaborator, DocumentOwnerUser } from '@/domains/document';
import { documentCollaboratorsQueryOptions } from '@/domains/document';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@shared/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';
import { cn } from '@shared/lib/utils';

const VISIBLE_COLLABORATOR_COUNT = 3;

type CollaboratorParticipant = {
  avatar?: string;
  email: string;
  id: string;
  name: string;
};

export function CollaboratorAvatarGroup({
  document,
}: {
  document: Document;
}) {
  const { data: collaborators = [] } = useQuery({
    ...documentCollaboratorsQueryOptions(document.id),
    enabled: Boolean(document.id),
  });
  const participants = getCollaboratorParticipants(document, collaborators);

  if (participants.length === 0) {
    return null;
  }

  const visibleCollaborators = participants.slice(0, VISIBLE_COLLABORATOR_COUNT);
  const hiddenCollaboratorCount = Math.max(
    participants.length - visibleCollaborators.length,
    0,
  );

  return (
    <AvatarGroup
      aria-label={getAvatarGroupLabel(participants)}
      className="ml-2 cursor-default"
    >
      {visibleCollaborators.map((participant) => (
        <CollaboratorAvatar
          key={participant.id}
          participant={participant}
        />
      ))}
      {hiddenCollaboratorCount > 0
        ? (
          <Tooltip>
            <TooltipTrigger
              delay={0}
              render={(
                <AvatarGroupCount
                  aria-label={`${hiddenCollaboratorCount} more collaborators`}
                  className="ring-2 ring-background"
                >
                  +{hiddenCollaboratorCount}
                </AvatarGroupCount>
              )}
            />
            <TooltipContent>
              {hiddenCollaboratorCount} more collaborator{hiddenCollaboratorCount === 1 ? '' : 's'}
            </TooltipContent>
          </Tooltip>
        )
        : null}
    </AvatarGroup>
  );
}

function CollaboratorAvatar({
  participant,
}: {
  participant: CollaboratorParticipant;
}) {
  const initial = getInitial(participant.name);

  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={(
          <Avatar
            aria-label={participant.name}
            size="sm"
            className="ring-2 ring-background"
          >
            {participant.avatar
              ? (
                <AvatarImage
                  alt=""
                  src={participant.avatar}
                />
              )
              : null}
            <AvatarFallback className={cn(!participant.avatar && 'bg-background')}>
              {initial}
            </AvatarFallback>
          </Avatar>
        )}
      />
      <TooltipContent>{participant.name}</TooltipContent>
    </Tooltip>
  );
}

function getCollaboratorParticipants(
  document: Document,
  collaborators: DocumentCollaborator[],
) {
  const participants = new Map<string, CollaboratorParticipant>();

  if (document.owner_user) {
    participants.set(
      document.owner_user.id,
      getOwnerParticipant(document.owner_user),
    );
  }

  for (const collaborator of collaborators) {
    participants.set(collaborator.user.id, {
      avatar: collaborator.user.avatar,
      email: collaborator.user.email,
      id: collaborator.user.id,
      name: collaborator.user.display_name ?? collaborator.user.email,
    });
  }

  return Array.from(participants.values());
}

function getOwnerParticipant(owner: DocumentOwnerUser) {
  return {
    avatar: owner.avatar,
    email: owner.email,
    id: owner.id,
    name: owner.display_name ?? owner.email,
  };
}

function getInitial(name: string) {
  return name.trim()[0]?.toUpperCase() ?? '?';
}

function getAvatarGroupLabel(participants: CollaboratorParticipant[]) {
  const names = participants.map((participant) => participant.name);

  if (names.length <= VISIBLE_COLLABORATOR_COUNT) {
    return `Collaborators: ${names.join(', ')}`;
  }

  return `Collaborators: ${names
    .slice(0, VISIBLE_COLLABORATOR_COUNT)
    .join(', ')}, and ${names.length - VISIBLE_COLLABORATOR_COUNT} more`;
}
