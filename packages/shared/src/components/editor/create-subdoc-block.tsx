'use client';

import { useRouter } from 'next/navigation';
import {
  createReactBlockSpec,
  type ReactCustomBlockRenderProps,
} from '@blocknote/react';
import { FileIcon, FileTextIcon } from 'lucide-react';

type UseWorkspaceSlug = () => string | undefined;

type SubdocBlockProps = {
  documentId: string;
  publicId: string;
  workspaceId: string;
  publishedDocumentId: string;
  title: string;
  hasContent: boolean;
};

type ResolvePrivateHref = (props: SubdocBlockProps & {
  workspaceSlug: string | undefined;
}) => string | null;

type CreateSubdocBlockOptions = {
  resolvePrivateHref: ResolvePrivateHref;
  useWorkspaceSlug?: UseWorkspaceSlug;
};

const subdocBlockConfig = {
  type: 'subdoc' as const,
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

function getPublicHref(publishedDocumentId: string) {
  return publishedDocumentId.length > 0
    ? `/share/${publishedDocumentId}`
    : null;
}

export function createSubdocBlock({
  resolvePrivateHref,
  useWorkspaceSlug,
}: CreateSubdocBlockOptions) {
  function SubdocBlock(
    props: ReactCustomBlockRenderProps<typeof subdocBlockConfig>,
  ) {
    const router = useRouter();
    const workspaceSlug = useWorkspaceSlug?.();

    const {
      documentId,
      publicId,
      workspaceId,
      title,
      publishedDocumentId,
      hasContent,
    } = props.block.props;

    const resolvedTitle = title || 'Untitled';
    const publicTarget = getPublicHref(publishedDocumentId);
    const privateTarget = resolvePrivateHref({
      documentId,
      publicId,
      workspaceId,
      publishedDocumentId,
      title: resolvedTitle,
      hasContent,
      workspaceSlug,
    });
    const targetHref = publicTarget ?? privateTarget;
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
        <span className="mt-0.5 min-w-0 truncate border-b border-border/40 text-sm font-semibold text-foreground">
          {resolvedTitle}
        </span>
      </button>
    );
  }

  return createReactBlockSpec(subdocBlockConfig, {
    render: SubdocBlock,
    toExternalHTML: ({ block }) => {
      const title = block.props.title || 'Untitled';

      return (
        <a
          href={
            getPublicHref(block.props.publishedDocumentId) ??
            resolvePrivateHref({
              documentId: block.props.documentId,
              publicId: block.props.publicId,
              workspaceId: block.props.workspaceId,
              publishedDocumentId: block.props.publishedDocumentId,
              title,
              hasContent: block.props.hasContent,
              workspaceSlug: block.props.workspaceId,
            }) ??
            '#'
          }
        >
          {title}
        </a>
      );
    },
  });
}
