'use client';

import { useRouter } from 'next/navigation';
import { FileIcon } from 'lucide-react';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';

import { workspaceRoutes } from '@/domains/workspace';

const subpageBlockConfig = {
  type: 'subpage' as const,
  propSchema: {
    documentId: {
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

function SubpageBlock(
  props: ReactCustomBlockRenderProps<typeof subpageBlockConfig>,
) {
  const router = useRouter();
  const { documentId, workspaceId, title } = props.block.props;

  return (
    <button
      type="button"
      contentEditable={false}
      className="inline-flex max-w-full cursor-pointer items-center gap-1 px-0 py-1 text-left align-top outline-none transition-opacity hover:opacity-80 focus:outline-none focus-visible:outline-none focus-visible:ring-0"
      onClick={() => {
        router.push(workspaceRoutes.document(workspaceId, documentId));
      }}
    >
      <FileIcon className="size-5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate border-b border-border/40 text-sm font-semibold text-foreground mt-0.5">
        {title || 'Untitled'}
      </span>
    </button>
  );
}

export const subpageBlock = createReactBlockSpec(subpageBlockConfig, {
  render: SubpageBlock,
  toExternalHTML: (props) => (
    <a href={workspaceRoutes.document(props.block.props.workspaceId, props.block.props.documentId)}>
      {props.block.props.title || 'Untitled'}
    </a>
  ),
});
