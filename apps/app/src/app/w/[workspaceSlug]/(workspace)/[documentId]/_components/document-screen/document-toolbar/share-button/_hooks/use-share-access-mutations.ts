'use client';

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  documentKeys,
  revokeDocumentAccess,
  revokeDocumentInvitation,
  shareDocument,
  shareDocuments,
  updateDocumentAccessSettings,
  updateDocumentInvitation,
  type Document,
  type DocumentAccessSettings,
  type DocumentAccessGrantPermission,
  type DocumentCollaborator,
  type DocumentInvitation,
} from '@/domains/document';
import { favoriteKeys } from '@/domains/favorite';
import { searchKeys } from '@/domains/search';

import type { SelectedInvitee } from './use-invite-composer';

type UseShareAccessMutationsOptions = {
  document: Document;
  workspaceMemberPermission?: DocumentAccessGrantPermission;
  workspaceSlug: string;
};

type ShareManyMutationInput = {
  grants: Array<{
    email?: string;
    permission: DocumentAccessGrantPermission;
    userId?: string;
  }>;
};

type ShareManyMutationContext = {
  optimisticInvitationIds: string[];
  previousInvitations?: DocumentInvitation[];
};

type CollaboratorMutationContext = {
  previousCollaborators?: DocumentCollaborator[];
};

type InvitationMutationContext = {
  previousInvitations?: DocumentInvitation[];
};

type AccessSettingsMutationContext = {
  previousAccessSettings?: DocumentAccessSettings;
  previousDocument?: Document;
};

export function useShareAccessMutations({
  document,
  workspaceMemberPermission,
  workspaceSlug,
}: UseShareAccessMutationsOptions) {
  const queryClient = useQueryClient();

  const invalidateSharingState = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: documentKeys.collaborators(document.id),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.invitations(document.id),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.accessSettings(document.id),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.detail(document.id),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.detail(document.public_id),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.lists(document.workspace_id),
      }),
      queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      }),
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.workspaceList(workspaceSlug),
      }),
      queryClient.invalidateQueries({
        queryKey: searchKeys.all(),
      }),
    ]);
  };

  const upsertInvitations = (invitations: DocumentInvitation[]) => {
    queryClient.setQueryData<DocumentInvitation[]>(
      documentKeys.invitations(document.id),
      (existing = []) => {
        const invitationsById = new Map(
          existing.map((invitation) => [invitation.id, invitation]),
        );

        for (const invitation of invitations) {
          invitationsById.set(invitation.id, invitation);
        }

        return Array.from(invitationsById.values());
      },
    );
  };

  const upsertCollaborators = (collaborators: DocumentCollaborator[]) => {
    queryClient.setQueryData<DocumentCollaborator[]>(
      documentKeys.collaborators(document.id),
      (existing = []) => {
        const collaboratorsById = new Map(
          existing.map((collaborator) => [collaborator.user.id, collaborator]),
        );

        for (const collaborator of collaborators) {
          collaboratorsById.set(collaborator.user.id, collaborator);
        }

        return Array.from(collaboratorsById.values());
      },
    );
  };

  const shareMutation = useMutation({
    mutationFn: async (input: {
      collaborator: DocumentCollaborator;
      permission: DocumentAccessGrantPermission;
    }) =>
      shareDocument(document.id, {
        user_id: input.collaborator.user.id,
        permission: input.permission,
      }),
    onMutate: async (input): Promise<CollaboratorMutationContext> => {
      await queryClient.cancelQueries({
        queryKey: documentKeys.collaborators(document.id),
      });

      const previousCollaborators =
        queryClient.getQueryData<DocumentCollaborator[]>(documentKeys.collaborators(document.id));

      upsertCollaborators([{
        ...input.collaborator,
        document_id: document.id,
        permission: input.permission,
        updated_at: new Date().toISOString(),
        access_source: 'direct',
        inherited_from_document_id: undefined,
        inherited_from_document_title: undefined,
      }]);

      return {
        previousCollaborators,
      };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(
        documentKeys.collaborators(document.id),
        context?.previousCollaborators ?? [],
      );
    },
    onSuccess: async (collaborator) => {
      await invalidateSharingState();
      upsertCollaborators([collaborator]);
    },
  });

  const shareManyMutation = useMutation({
    mutationFn: async (input: ShareManyMutationInput) =>
      shareDocuments(document.id, {
        grants: input.grants.map((grant) => ({
          user_id: grant.userId,
          email: grant.email,
          permission: grant.permission,
        })),
      }),
    onMutate: async (input): Promise<ShareManyMutationContext> => {
      await queryClient.cancelQueries({
        queryKey: documentKeys.invitations(document.id),
      });

      const previousInvitations =
        queryClient.getQueryData<DocumentInvitation[]>(documentKeys.invitations(document.id));

      const optimisticInvitations = createOptimisticInvitations(document, input.grants);

      upsertInvitations(optimisticInvitations);

      return {
        optimisticInvitationIds: optimisticInvitations.map((invitation) => invitation.id),
        previousInvitations,
      };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(
        documentKeys.invitations(document.id),
        context?.previousInvitations ?? [],
      );
    },
    onSuccess: async (result, _input, context) => {
      removeInvitationsById(queryClient, document.id, context.optimisticInvitationIds);
      await invalidateSharingState();
      upsertCollaborators(result.collaborators);
      upsertInvitations(result.invitations);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (collaborator: DocumentCollaborator) =>
      revokeDocumentAccess(document.id, collaborator.user.id),
    onMutate: async (collaborator): Promise<CollaboratorMutationContext> => {
      await queryClient.cancelQueries({
        queryKey: documentKeys.collaborators(document.id),
      });

      const previousCollaborators =
        queryClient.getQueryData<DocumentCollaborator[]>(documentKeys.collaborators(document.id));

      removeCollaboratorByUserId(queryClient, document.id, collaborator.user.id);

      return {
        previousCollaborators,
      };
    },
    onError: (_error, _collaborator, context) => {
      queryClient.setQueryData(
        documentKeys.collaborators(document.id),
        context?.previousCollaborators ?? [],
      );
    },
    onSuccess: async (_revokedAccess, collaborator) => {
      await invalidateSharingState();
      removeCollaboratorByUserId(queryClient, document.id, collaborator.user.id);
    },
  });

  const updateAccessSettingsMutation = useMutation({
    mutationFn: (permission: DocumentAccessGrantPermission | undefined) =>
      updateDocumentAccessSettings(document.id, {
        workspace_member_permission: permission ?? null,
      }),
    onMutate: async (permission): Promise<AccessSettingsMutationContext> => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: documentKeys.accessSettings(document.id),
        }),
        queryClient.cancelQueries({
          queryKey: documentKeys.detail(document.id),
        }),
        queryClient.cancelQueries({
          queryKey: documentKeys.detail(document.public_id),
        }),
      ]);

      const previousAccessSettings =
        queryClient.getQueryData<DocumentAccessSettings>(
          documentKeys.accessSettings(document.id),
        );
      const previousDocument =
        queryClient.getQueryData<Document>(documentKeys.detail(document.id));

      setWorkspaceMemberPermission(queryClient, document, permission);

      return {
        previousAccessSettings,
        previousDocument,
      };
    },
    onError: (_error, _permission, context) => {
      queryClient.setQueryData(
        documentKeys.accessSettings(document.id),
        context?.previousAccessSettings,
      );
      queryClient.setQueryData(
        documentKeys.detail(document.id),
        context?.previousDocument,
      );
      queryClient.setQueryData(
        documentKeys.detail(document.public_id),
        context?.previousDocument,
      );
    },
    onSuccess: async (accessSettings) => {
      setWorkspaceMemberPermission(
        queryClient,
        document,
        accessSettings.workspace_member_permission,
      );
      await invalidateSharingState();
    },
  });

  const updateInvitationMutation = useMutation({
    mutationFn: (input: {
      invitationId: string;
      permission: DocumentAccessGrantPermission;
    }) =>
      updateDocumentInvitation(document.id, input.invitationId, {
        permission: input.permission,
      }),
    onMutate: async (input): Promise<InvitationMutationContext> => {
      await queryClient.cancelQueries({
        queryKey: documentKeys.invitations(document.id),
      });

      const previousInvitations =
        queryClient.getQueryData<DocumentInvitation[]>(documentKeys.invitations(document.id));

      setInvitationPermission(queryClient, document.id, input.invitationId, input.permission);

      return {
        previousInvitations,
      };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(
        documentKeys.invitations(document.id),
        context?.previousInvitations ?? [],
      );
    },
    onSuccess: async (invitation) => {
      await invalidateSharingState();
      upsertInvitations([invitation]);
    },
  });

  const revokeInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => revokeDocumentInvitation(document.id, invitationId),
    onMutate: async (invitationId): Promise<InvitationMutationContext> => {
      await queryClient.cancelQueries({
        queryKey: documentKeys.invitations(document.id),
      });

      const previousInvitations =
        queryClient.getQueryData<DocumentInvitation[]>(documentKeys.invitations(document.id));

      removeInvitationsById(queryClient, document.id, [invitationId]);

      return {
        previousInvitations,
      };
    },
    onError: (_error, _invitationId, context) => {
      queryClient.setQueryData(
        documentKeys.invitations(document.id),
        context?.previousInvitations ?? [],
      );
    },
    onSuccess: async (_revokedInvitation, invitationId) => {
      await invalidateSharingState();
      removeInvitationsById(queryClient, document.id, [invitationId]);
    },
  });

  const isMutating =
    shareMutation.isPending
    || shareManyMutation.isPending
    || revokeMutation.isPending
    || updateInvitationMutation.isPending
    || revokeInvitationMutation.isPending
    || updateAccessSettingsMutation.isPending;

  const shareInvitees = (
    invitees: SelectedInvitee[],
    permission: DocumentAccessGrantPermission,
  ) =>
    shareManyMutation.mutateAsync({
      grants: invitees.map((invitee) => ({
        userId: invitee.userId,
        email: invitee.userId ? undefined : invitee.email,
        permission,
      })),
    });

  const updatePermission = (
    collaborator: DocumentCollaborator,
    permission: DocumentAccessGrantPermission,
  ) => {
    if (collaborator.permission === permission || isMutating) {
      return;
    }

    shareMutation.mutate({
      collaborator,
      permission,
    }, {
      onSuccess: () => {
        toast('Updated access');
      },
    });
  };

  const revokeAccess = (collaborator: DocumentCollaborator) => {
    if (isMutating) {
      return;
    }

    revokeMutation.mutate(collaborator, {
      onSuccess: () => {
        toast('Access revoked');
      },
    });
  };

  const updateInvitationPermission = (
    invitation: DocumentInvitation,
    permission: DocumentAccessGrantPermission,
  ) => {
    if (invitation.permission === permission || isMutating) {
      return;
    }

    updateInvitationMutation.mutate({
      invitationId: invitation.id,
      permission,
    }, {
      onSuccess: () => {
        toast('Updated invitation');
      },
    });
  };

  const revokeInvitation = (invitation: DocumentInvitation) => {
    if (isMutating) {
      return;
    }

    revokeInvitationMutation.mutate(invitation.id, {
      onSuccess: () => {
        toast('Invitation revoked');
      },
    });
  };

  const updateWorkspaceMemberPermission = (
    permission: DocumentAccessGrantPermission | undefined,
  ) => {
    if (workspaceMemberPermission === permission || isMutating) {
      return;
    }

    updateAccessSettingsMutation.mutate(permission, {
      onSuccess: () => {
        toast(permission ? 'Workspace access updated' : 'Workspace access restricted');
      },
    });
  };

  return {
    isInvitePending: shareManyMutation.isPending,
    isMutating,
    revokeAccess,
    revokeInvitation,
    shareInvitees,
    updateInvitationPermission,
    updatePermission,
    updateWorkspaceMemberPermission,
  };
}

function removeInvitationsById(
  queryClient: QueryClient,
  documentId: string,
  invitationIds: string[],
) {
  if (invitationIds.length === 0) {
    return;
  }

  const invitationIdSet = new Set(invitationIds);

  queryClient.setQueryData<DocumentInvitation[]>(
    documentKeys.invitations(documentId),
    (existing = []) =>
      existing.filter((invitation) => !invitationIdSet.has(invitation.id)),
  );
}

function removeCollaboratorByUserId(
  queryClient: QueryClient,
  documentId: string,
  userId: string,
) {
  queryClient.setQueryData<DocumentCollaborator[]>(
    documentKeys.collaborators(documentId),
    (existing = []) =>
      existing.filter((collaborator) => collaborator.user.id !== userId),
  );
}

function setInvitationPermission(
  queryClient: QueryClient,
  documentId: string,
  invitationId: string,
  permission: DocumentAccessGrantPermission,
) {
  queryClient.setQueryData<DocumentInvitation[]>(
    documentKeys.invitations(documentId),
    (existing = []) =>
      existing.map((invitation) => invitation.id === invitationId
        ? {
          ...invitation,
          permission,
          updated_at: new Date().toISOString(),
        }
        : invitation),
  );
}

function setWorkspaceMemberPermission(
  queryClient: QueryClient,
  document: Document,
  permission: DocumentAccessGrantPermission | undefined,
) {
  const now = new Date().toISOString();

  queryClient.setQueryData<DocumentAccessSettings>(
    documentKeys.accessSettings(document.id),
    (existing) => existing
      ? {
        ...existing,
        workspace_member_permission: permission,
        updated_at: now,
      }
      : {
        document_id: document.id,
        workspace_member_permission: permission,
        updated_by_user_id: document.owner_user_id,
        created_at: now,
        updated_at: now,
      },
  );

  const updateDocument = (currentDocument: Document | undefined) =>
    currentDocument
      ? {
        ...currentDocument,
        access: currentDocument.access
          ? {
            ...currentDocument.access,
            workspace_member_permission: permission,
          }
          : currentDocument.access,
      }
      : currentDocument;

  queryClient.setQueryData<Document>(
    documentKeys.detail(document.id),
    updateDocument,
  );
  queryClient.setQueryData<Document>(
    documentKeys.detail(document.public_id),
    updateDocument,
  );
}

function createOptimisticInvitations(
  document: Document,
  grants: ShareManyMutationInput['grants'],
): DocumentInvitation[] {
  const now = new Date().toISOString();

  return grants.flatMap((grant) => {
    if (!grant.email || grant.userId) {
      return [];
    }

    const email = grant.email.toLowerCase();

    return [{
      id: getOptimisticInvitationId(document.id, email),
      document_id: document.id,
      email,
      permission: grant.permission,
      invited_by_user_id: document.owner_user_id,
      created_at: now,
      updated_at: now,
      status: 'pending',
    }];
  });
}

function getOptimisticInvitationId(documentId: string, email: string): string {
  return `optimistic-invitation:${documentId}:${email}`;
}
