'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getWorkspaceBlockLimitReachedData } from '@/domains/subscription';
import {
  createRootDocument,
  documentKeys,
  type Document,
} from '@/domains/document';
import {
  insertCreatedRootDocument,
  replaceCreatedRootDocument,
} from '@/domains/document/cache/document-query-cache';
import {
  getDocumentListSnapshot,
  restoreDocumentListSnapshot,
} from '@/domains/document/actions/document-action-cache';
import { workspaceRoutes } from '@/domains/workspace';

function createOptimisticRootDocument(
  workspaceSlug: string,
  teamspaceId?: string,
): Document {
  const now = Date.now();
  const timestamp = new Date(now).toISOString();

  return {
    id: `optimistic-root-doc:${workspaceSlug}:${now}`,
    public_id: `optimistic-root-doc:${workspaceSlug}:${now}`,
    version: 0,
    workspace_id: workspaceSlug,
    owner_user_id: 'optimistic-owner',
    teamspace_id: teamspaceId,
    parent_document_id: undefined,
    title: 'Untitled',
    content_format: 'blocknote_v1',
    content: [],
    sort_key: now,
    archived_at: undefined,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

type CreateRootDocumentMutationContext = {
  optimisticDocumentId: string;
  previousDocumentLists: ReturnType<typeof getDocumentListSnapshot>;
};

export function useCreateRootDocumentAction(
  workspaceSlug: string,
  options?: {
    teamspaceId?: string;
  },
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const teamspaceId = options?.teamspaceId;

  const createDocumentMutation = useMutation({
    mutationFn: () =>
      createRootDocument({
        workspace_id: workspaceSlug,
        teamspace_id: teamspaceId,
      }),
    onMutate: async (): Promise<CreateRootDocumentMutationContext> => {
      await queryClient.cancelQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });

      const previousDocumentLists = getDocumentListSnapshot(
        queryClient,
        workspaceSlug,
      );

      const optimisticDocument = createOptimisticRootDocument(
        workspaceSlug,
        teamspaceId,
      );

      queryClient.setQueryData(
        documentKeys.detail(optimisticDocument.id),
        optimisticDocument,
      );

      insertCreatedRootDocument(
        queryClient,
        workspaceSlug,
        optimisticDocument,
      );

      return {
        optimisticDocumentId: optimisticDocument.id,
        previousDocumentLists,
      };
    },
    onError: (error, _variables, context) => {
      if (!context) {
        return;
      }

      restoreDocumentListSnapshot(queryClient, context.previousDocumentLists);

      queryClient.removeQueries({
        queryKey: documentKeys.detail(context.optimisticDocumentId),
        exact: true,
      });

      const blockLimitError = getWorkspaceBlockLimitReachedData(error);

      if (blockLimitError) {
        toast('Block limit reached', {
          action: {
            label: 'Upgrade',
            onClick: () => {
              router.push(workspaceRoutes.settingsBilling(workspaceSlug));
            },
          },
        });
        return;
      }

      toast('Could not create document');
    },
    onSuccess: (document, _variables, context) => {
      replaceCreatedRootDocument(
        queryClient,
        workspaceSlug,
        context?.optimisticDocumentId ?? document.id,
        document,
      );

      router.push(
        workspaceRoutes.document(
          workspaceSlug,
          document.public_id,
          document.title,
        ),
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
    },
  });

  return {
    createDocumentMutation,
    handleCreateDocument: () => {
      createDocumentMutation.mutate();
    },
  };
}
