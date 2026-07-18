import { useMutation, useQueryClient } from '@tanstack/react-query';

import { hasMeaningfulContent } from '@shared/components/editor/has-meaningful-content';

import { archiveSubdocCommand } from '../api/document.requests';
import { documentKeys } from '../api/document.keys';
import type {
  ArchiveSubdocCommandResult,
  Document,
} from '../api/document.types';
import {
  removeCachedNavigationDocument,
  updateCachedNavigationContentStatus,
} from '../cache/document-query-cache';

type ArchiveSubdocumentDocument = Pick<
  Document,
  'id' | 'public_id' | 'title' | 'breadcrumb' | 'version'
>;

export type ArchiveSubdocumentInput = {
  subdocumentId: string;
  content?: unknown[];
};

type SharedArchiveSubdocumentContext = {
  previousListEntries: Array<readonly [ReadonlyArray<unknown>, unknown]>;
  previousParentDocument?: Document;
  previousSubdocument?: Document;
};

export type UseArchiveSubdocumentMutationArgs<
  TDocument extends ArchiveSubdocumentDocument,
  TContext,
> = {
  document: TDocument;
  workspaceSlug: string;
  onMutate?: (
    input: ArchiveSubdocumentInput,
    context: SharedArchiveSubdocumentContext,
  ) => Promise<TContext | undefined> | TContext | undefined;
  onError?: (
    error: Error,
    input: ArchiveSubdocumentInput,
    context: (TContext & SharedArchiveSubdocumentContext) | undefined,
  ) => Promise<void> | void;
  onSuccess?: (
    result: ArchiveSubdocCommandResult,
    input: ArchiveSubdocumentInput,
    context: (TContext & SharedArchiveSubdocumentContext) | undefined,
  ) => Promise<void> | void;
  onSettled?: (
    result: ArchiveSubdocCommandResult | undefined,
    error: Error | null,
    input: ArchiveSubdocumentInput,
    context: (TContext & SharedArchiveSubdocumentContext) | undefined,
  ) => Promise<void> | void;
};

function mergeDocumentWithCachedDetail(
  nextDocument: Document,
  cachedDocument?: Document,
): Document {
  return {
    ...(cachedDocument ?? {}),
    ...nextDocument,
    breadcrumb: nextDocument.breadcrumb ?? cachedDocument?.breadcrumb,
  };
}

function syncParentDocumentCache(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceSlug: string,
  documentId: string,
  documentPublicId: string,
  nextDocument: Document,
) {
  const cachedDocument =
    queryClient.getQueryData<Document>(documentKeys.detail(documentId)) ??
    queryClient.getQueryData<Document>(documentKeys.detail(documentPublicId));
  const mergedDocument = mergeDocumentWithCachedDetail(
    nextDocument,
    cachedDocument,
  );

  queryClient.setQueryData<Document>(documentKeys.detail(documentId), mergedDocument);
  queryClient.setQueryData<Document>(
    documentKeys.detail(mergedDocument.public_id),
    mergedDocument,
  );
  updateCachedNavigationContentStatus(
    queryClient,
    workspaceSlug,
    documentId,
    hasMeaningfulContent(mergedDocument.content),
  );
}

export function useArchiveSubdocumentMutationImpl<
  TDocument extends ArchiveSubdocumentDocument,
  TContext extends object = Record<string, never>,
>({
  document,
  workspaceSlug,
  onMutate,
  onError,
  onSuccess,
  onSettled,
}: UseArchiveSubdocumentMutationArgs<TDocument, TContext>) {
  const queryClient = useQueryClient();

  return useMutation<
    ArchiveSubdocCommandResult,
    Error,
    ArchiveSubdocumentInput,
    (TContext & SharedArchiveSubdocumentContext) | undefined
  >({
    mutationFn: async ({ subdocumentId, content }) => {
      const latestDocument =
        queryClient.getQueryData<Document>(documentKeys.detail(document.id)) ?? document;

      return archiveSubdocCommand(document.id, {
        subdocument_id: subdocumentId,
        version: latestDocument.version,
        content,
      });
    },
    onMutate: async (input) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: documentKeys.detail(document.id) }),
        queryClient.cancelQueries({ queryKey: documentKeys.detail(input.subdocumentId) }),
        queryClient.cancelQueries({ queryKey: documentKeys.lists(workspaceSlug) }),
      ]);

      const previousParentDocument =
        queryClient.getQueryData<Document>(documentKeys.detail(document.id)) ?? undefined;

      const previousSubdocument = queryClient.getQueryData<Document>(
        documentKeys.detail(input.subdocumentId),
      );

      const previousListEntries = queryClient.getQueriesData({
        queryKey: documentKeys.lists(workspaceSlug),
      });

      const sharedContext: SharedArchiveSubdocumentContext = {
        previousListEntries,
        previousParentDocument,
        previousSubdocument,
      };

      if (input.content !== undefined && previousParentDocument) {
        syncParentDocumentCache(
          queryClient,
          workspaceSlug,
          document.id,
          document.public_id,
          {
            ...previousParentDocument,
            content: input.content,
          },
        );
      }

      removeCachedNavigationDocument(
        queryClient,
        workspaceSlug,
        input.subdocumentId,
      );

      const extendedContext = await onMutate?.(input, sharedContext);

      return {
        ...sharedContext,
        ...(extendedContext ?? {}),
      } as (TContext & SharedArchiveSubdocumentContext) | undefined;
    },
    onSuccess: async (result, input, context) => {
      syncParentDocumentCache(
        queryClient,
        workspaceSlug,
        document.id,
        document.public_id,
        result.parent_document,
      );
      queryClient.setQueryData(
        documentKeys.detail(result.archived_child_document.id),
        result.archived_child_document,
      );
      removeCachedNavigationDocument(
        queryClient,
        workspaceSlug,
        result.archived_child_document.id,
      );

      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });

      await onSuccess?.(result, input, context);
    },
    onError: async (error, input, context) => {
      if (context?.previousParentDocument) {
        syncParentDocumentCache(
          queryClient,
          workspaceSlug,
          document.id,
          document.public_id,
          context.previousParentDocument,
        );
      }

      if (context?.previousSubdocument) {
        queryClient.setQueryData(
          documentKeys.detail(input.subdocumentId),
          context.previousSubdocument,
        );
      }

      for (const [queryKey, data] of context?.previousListEntries ?? []) {
        queryClient.setQueryData(queryKey, data);
      }

      await onError?.(error, input, context);
    },
    onSettled: async (result, error, input, context) => {
      await onSettled?.(result, error, input, context);
    },
  });
}
