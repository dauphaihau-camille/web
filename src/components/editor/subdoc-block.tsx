'use client';

import { useParams, useRouter } from 'next/navigation';
import { FileIcon, FileTextIcon } from 'lucide-react';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';

import { useDocumentQuery } from '@/domains/document';
import { workspaceRoutes } from '@/domains/workspace';
import { hasMeaningfulContent } from './has-meaningful-content';

const subdocBlockConfig = {
  type: 'subpage' as const,
  propSchema: {
    documentId: {
      default: '',
    },
    publicId: {
      default: '',
    },
    workspaceId: {
      default: '',
    },
    title: {
      default: 'Untitled',
    },
  },
  content: 'none' as const,
};

function SubdocBlock(
  props: ReactCustomBlockRenderProps<typeof subdocBlockConfig>,
) {
  const router = useRouter();
  const params = useParams<{ workspaceSlug?: string }>();

  const {
    documentId, publicId, workspaceId, title,
  } = props.block.props;

  const workspaceSlug =
    (typeof params.workspaceSlug === 'string' ? params.workspaceSlug : undefined)
    || workspaceId;
  const documentQuery = useDocumentQuery(documentId);
  const hasContent = hasMeaningfulContent(documentQuery.data?.content);
  const DocumentIcon = hasContent ? FileTextIcon : FileIcon;

  return (
    <button
      type="button"
      contentEditable={false}
      className="inline-flex w-full max-w-full cursor-pointer items-center gap-1 rounded-[inherit] px-2 py-0.5 text-left align-top outline-none transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0"
      onClick={() => {
        if (!workspaceSlug) {
          return;
        }

        router.push(workspaceRoutes.document(workspaceSlug, publicId || documentId, title));
      }}
    >
      <DocumentIcon className="size-5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate border-b border-border/40 text-sm font-semibold text-foreground mt-0.5">
        {title || 'Untitled'}
      </span>
    </button>
  );
}

export const subdocBlock = createReactBlockSpec(subdocBlockConfig, {
  render: SubdocBlock,
  toExternalHTML: ({ block }) => (
    <a href={workspaceRoutes.document(block.props.workspaceId, block.props.publicId || block.props.documentId, block.props.title)}>
      {block.props.title || 'Untitled'}
    </a>
  ),
});
