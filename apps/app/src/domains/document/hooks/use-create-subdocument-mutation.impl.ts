import { useMutation, useQueryClient } from '@tanstack/react-query';

import { hasMeaningfulContent } from '@shared/components/editor/has-meaningful-content';

import { createSubdocumentCommand } from '../api/document.requests';
import { documentKeys } from '../api/document.keys';
import type {
  CreateSubdocumentCommandInput,
  CreateSubdocumentCommandResult,
  Document,
} from '../api/document.types';
import {
  insertCreatedSubdocIntoCachedChildren,
  markCachedNavigationNodeHasChildren,
  replaceCreatedSubdocInCachedChildren,
  updateCachedNavigationContentStatus,
} from '../cache/document-query-cache';

type CreateSubdocumentDocument = Pick<
  Document,
  'id' | 'public_id' | 'title' | 'breadcrumb'
> & Partial<Pick<Document, 'version'>>;

export type CreateSubdocumentInput = {
  anchorBlockId?: string;
  slashCommandText?: string;
  content?: unknown[];
};

type SharedCreateSubdocumentContext = {
  optimisticChildId?: string;
};

export type UseCreateSubdocumentMutationArgs<
  TDocument extends CreateSubdocumentDocument,
  TContext,
> = {
  document: TDocument;
  workspaceSlug: string;
  onMutate?: (
    input: CreateSubdocumentInput | undefined,
  ) => Promise<TContext | undefined> | TContext | undefined;
  onError?: (
    error: Error,
    input: CreateSubdocumentInput | undefined,
    context: (TContext & SharedCreateSubdocumentContext) | undefined,
  ) => Promise<void> | void;
  onSuccess?: (
    result: CreateSubdocumentCommandResult,
    input: CreateSubdocumentInput | undefined,
    context: (TContext & SharedCreateSubdocumentContext) | undefined,
  ) => Promise<void> | void;
  onSettled?: (
    result: CreateSubdocumentCommandResult | undefined,
    error: Error | null,
    input: CreateSubdocumentInput | undefined,
    context: (TContext & SharedCreateSubdocumentContext) | undefined,
  ) => Promise<void> | void;
};

function withParentBreadcrumb(
  childDocument: Document,
  parentDocument: Pick<Document, 'breadcrumb' | 'id' | 'public_id' | 'title'>,
): Document {
  return {
    ...childDocument,
    breadcrumb: [
      ...(parentDocument.breadcrumb ?? []),
      {
        id: parentDocument.id,
        public_id: parentDocument.public_id,
        title: parentDocument.title,
      },
    ],
  };
}

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

export function useCreateSubdocumentMutationImpl<
  TDocument extends CreateSubdocumentDocument,
  TContext extends object = Record<string, never>,
>({
  document,
  workspaceSlug,
  onMutate,
  onError,
  onSuccess,
  onSettled,
}: UseCreateSubdocumentMutationArgs<TDocument, TContext>) {
  const queryClient = useQueryClient();

  return useMutation<
    CreateSubdocumentCommandResult,
    Error,
    CreateSubdocumentInput | undefined,
    (TContext & SharedCreateSubdocumentContext) | undefined
  >({
    mutationFn: (input) => {
      const latestDocument =
        queryClient.getQueryData<Document>(documentKeys.detail(document.id)) ?? document;

      const payload: CreateSubdocumentCommandInput = {
        anchor_block_id: input?.anchorBlockId,
        slash_command_text: input?.slashCommandText,
        version: latestDocument.version,
        content: input?.content,
      };

      return createSubdocumentCommand(document.id, payload);
    },
    onMutate: async (input) => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: documentKeys.detail(document.id),
        }),
        queryClient.cancelQueries({
          queryKey: documentKeys.lists(workspaceSlug),
        }),
      ]);

      const context = await onMutate?.(input);
      return context as (TContext & SharedCreateSubdocumentContext) | undefined;
    },
    onError: async (error, input, context) => {
      await onError?.(error, input, context);
    },
    onSuccess: async (result, input, context) => {
      const { child_document: childDocument, parent_document: parentDocument } = result;
      const cachedParentDocument = queryClient.getQueryData<Document>(
        documentKeys.detail(document.id),
      );
      const parentDocumentForBreadcrumb = cachedParentDocument ?? {
        breadcrumb: document.breadcrumb,
        id: document.id,
        public_id: document.public_id,
        title: document.title,
      };
      const nextChildDocument = withParentBreadcrumb(
        childDocument,
        parentDocumentForBreadcrumb,
      );
      const nextParentDocument = mergeDocumentWithCachedDetail(
        parentDocument,
        cachedParentDocument,
      );

      queryClient.setQueryData(
        documentKeys.detail(nextChildDocument.id),
        nextChildDocument,
      );
      queryClient.setQueryData(
        documentKeys.detail(nextChildDocument.public_id),
        nextChildDocument,
      );
      queryClient.setQueryData(
        documentKeys.detail(nextParentDocument.id),
        nextParentDocument,
      );
      queryClient.setQueryData(
        documentKeys.detail(nextParentDocument.public_id),
        nextParentDocument,
      );

      updateCachedNavigationContentStatus(
        queryClient,
        workspaceSlug,
        document.id,
        hasMeaningfulContent(nextParentDocument.content),
      );
      markCachedNavigationNodeHasChildren(
        queryClient,
        workspaceSlug,
        document.id,
      );

      if (context?.optimisticChildId) {
        replaceCreatedSubdocInCachedChildren(
          queryClient,
          workspaceSlug,
          document.id,
          context.optimisticChildId,
          nextChildDocument,
        );
      }
      else {
        insertCreatedSubdocIntoCachedChildren(
          queryClient,
          workspaceSlug,
          document.id,
          nextChildDocument,
        );
      }

      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });

      await onSuccess?.(result, input, context);
    },
    onSettled: async (result, error, input, context) => {
      await onSettled?.(result, error, input, context);
    },
  });
}
