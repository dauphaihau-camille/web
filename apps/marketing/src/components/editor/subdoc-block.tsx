'use client';

import { useParams, useRouter } from 'next/navigation';
import { FileIcon, FileTextIcon } from 'lucide-react';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';

import { workspaceRoutes } from '@shared/domains/workspace';

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
    publishedDocumentId: {
      default: '',
    },
    title: {
      default: 'Untitled',
    },
    hasContent: {
      default: false,
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
    documentId,
    publicId,
    workspaceId,
    title,
    publishedDocumentId,
    hasContent: hasContentProp,
  } = props.block.props;

  const workspaceSlug =
    (typeof params.workspaceSlug === 'string' ? params.workspaceSlug : undefined)
    || workspaceId;
  const resolvedTitle = title || 'Untitled';
  const publicTarget = typeof publishedDocumentId === 'string' && publishedDocumentId.length > 0
    ? `/share/${publishedDocumentId}`
    : null;
  const privateTarget = workspaceSlug
    ? workspaceRoutes.document(workspaceSlug, publicId || documentId, resolvedTitle)
    : null;
  const targetHref = publicTarget ?? privateTarget;
  const hasContent = hasContentProp;
  const DocumentIcon = hasContent ? FileTextIcon : FileIcon;

  return (
    <button
      type="button"
      contentEditable={false}
      aria-disabled={!targetHref}
      className="inline-flex w-full max-w-full items-center gap-1 rounded-[inherit] px-2 py-0.5 text-left align-top outline-none transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0 aria-disabled:cursor-default aria-disabled:opacity-60"
      onClick={() => {
        if (!targetHref) {
          return;
        }
        router.push(targetHref);
      }}
    >
      <DocumentIcon className="size-5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate border-b border-border/40 text-sm font-semibold text-foreground mt-0.5">
        {resolvedTitle}
      </span>
    </button>
  );
}

export const subdocBlock = createReactBlockSpec(subdocBlockConfig, {
  render: SubdocBlock,
  toExternalHTML: ({ block }) => (
    <a
      href={
        block.props.publishedDocumentId
          ? `/share/${block.props.publishedDocumentId}`
          : workspaceRoutes.document(
            block.props.workspaceId,
            block.props.publicId || block.props.documentId,
            block.props.title,
          )
      }
    >
      {block.props.title || 'Untitled'}
    </a>
  ),
});
