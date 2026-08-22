'use client';

import { useParams } from 'next/navigation';

import { createSubdocBlock } from '@shared/components/editor/create-subdoc-block';
import { workspaceRoutes } from '@/domains/workspace';

export const subdocBlock = createSubdocBlock({
  useWorkspaceSlug,
  resolvePrivateHref: ({
    documentId,
    publicId,
    title,
    workspaceId,
    workspaceSlug,
  }) => {
    const resolvedWorkspaceSlug = workspaceSlug || workspaceId;

    return resolvedWorkspaceSlug
      ? workspaceRoutes.document(
        resolvedWorkspaceSlug,
        publicId || documentId,
        title,
      )
      : null;
  },
});

function useWorkspaceSlug() {
  const params = useParams<{ workspaceSlug?: string }>();

  return typeof params.workspaceSlug === 'string'
    ? params.workspaceSlug
    : undefined;
}
