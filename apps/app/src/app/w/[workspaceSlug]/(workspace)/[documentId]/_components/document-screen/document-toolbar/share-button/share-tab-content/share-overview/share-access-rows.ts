import type {
  DocumentCollaborator,
  DocumentInvitation,
  DocumentOwnerUser,
} from '@/domains/document';

export type ShareAccessRow =
  | {
    avatar?: string;
    email: string;
    id: string;
    isOwner: true;
    name: string;
  }
  | {
    avatar?: string;
    collaborator: DocumentCollaborator;
    email: string;
    id: string;
    isOwner: false;
    name: string;
  }
  | {
    email: string;
    id: string;
    invitation: DocumentInvitation;
    isOwner: false;
    name: string;
  };

export function getShareAccessRows({
  collaborators,
  currentUserId,
  invitations,
  ownerMember,
}: {
  collaborators: DocumentCollaborator[];
  currentUserId?: string;
  invitations: DocumentInvitation[];
  ownerMember?: DocumentOwnerUser;
}) {
  const rows: ShareAccessRow[] = [];

  if (ownerMember) {
    rows.push({
      avatar: ownerMember.avatar,
      email: ownerMember.email,
      id: ownerMember.id,
      isOwner: true,
      name: ownerMember.display_name ?? ownerMember.email,
    });
  }

  for (const collaborator of collaborators) {
    rows.push({
      avatar: collaborator.user.avatar,
      collaborator,
      email: collaborator.user.email,
      id: collaborator.user.id,
      isOwner: false,
      name: collaborator.user.display_name ?? collaborator.user.email,
    });
  }

  for (const invitation of invitations) {
    rows.push({
      email: '',
      id: invitation.id,
      invitation,
      isOwner: false,
      name: invitation.email,
    });
  }

  return rows.sort((left, right) => {
    if (left.id === currentUserId) {
      return -1;
    }

    if (right.id === currentUserId) {
      return 1;
    }

    return 0;
  });
}
