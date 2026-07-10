'use client';

import { createSubdocBlock } from '@shared/components/editor/create-subdoc-block';
import { workspaceRoutes } from '@shared/domains/workspace/workspace-routes';

export const subdocBlock = createSubdocBlock({
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
