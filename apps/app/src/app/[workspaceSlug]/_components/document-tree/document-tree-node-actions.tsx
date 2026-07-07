 
'use client';

import { useState } from 'react';
import {
  CopyIcon,
  EllipsisIcon,
  LinkIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';
import {
  archiveDocument,
  createDocument,
  documentDetailQueryOptions,
  documentKeys,
  duplicateDocument,
  type Document,
  type DocumentNavigationNode,
  type WorkspaceDocumentNavigation,
  workspaceDocumentChildrenQueryOptions,
  workspaceDocumentRootQueryOptions,
} from '@shared/domains/document';
import {
  favoriteDocument,
  favoriteKeys,
  favoriteStatusQueryOptions,
  unfavoriteDocument,
} from '@/domains/favorite';
import { LoadingIcon } from '@shared/components/loading-icon';
import { cn } from '@shared/lib/utils';
import { useDocumentTreeExpansionStore } from '@/stores/document-tree-expansion-store';
import { workspaceRoutes } from '@shared/domains/workspace';

import {
  insertCreatedSubdocIntoCachedChildren,
  markCachedNavigationNodeHasChildren,
  removeCachedNavigationDocument,
} from '../../(workspace)/[documentId]/_components/document-screen/document-screen-cache';

type DocumentTreeNodeActionsProps = {
  document: DocumentNavigationNode;
  isActive: boolean;
  workspaceSlug: string;
};

export function DocumentTreeNodeActions({
  document,
  isActive,
  workspaceSlug,
}: DocumentTreeNodeActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const expandedByWorkspace = useDocumentTreeExpansionStore(
    (state) => state.expandedByWorkspace,
  );
  const setExpandedDocumentIds = useDocumentTreeExpansionStore(
    (state) => state.setExpandedDocumentIds,
  );

  const favoriteStatusQuery = useQuery({
    ...favoriteStatusQueryOptions(document.id),
    enabled: isMenuOpen,
  });

  const createSubdocumentMutation = useMutation({
    mutationFn: () =>
      createDocument({
        workspace_id: workspaceSlug,
        teamspace_id: document.teamspace_id,
        parent_document_id: document.id,
      }),
    onSuccess: async (childDocument) => {
      queryClient.setQueryData(
        documentKeys.detail(childDocument.id),
        childDocument,
      );
      markCachedNavigationNodeHasChildren(
        queryClient,
        workspaceSlug,
        document.id,
      );
      insertCreatedSubdocIntoCachedChildren(
        queryClient,
        workspaceSlug,
        document.id,
        childDocument,
      );
      setExpandedDocumentIds(workspaceSlug, [
        ...(expandedByWorkspace[workspaceSlug] ?? []),
        document.id,
      ]);
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
      router.push(
        workspaceRoutes.document(
          workspaceSlug,
          childDocument.public_id,
          childDocument.title,
        ),
      );
    },
  });

  const duplicateDocumentMutation = useMutation({
    mutationFn: () => duplicateDocument(document.id),
    onSuccess: async (duplicatedDocument) => {
      queryClient.setQueryData(
        documentKeys.detail(duplicatedDocument.id),
        duplicatedDocument,
      );
      if (duplicatedDocument.parent_document_id) {
        await queryClient.invalidateQueries({
          queryKey: documentKeys.detail(duplicatedDocument.parent_document_id),
        });
      }
      await queryClient.invalidateQueries({
        queryKey: documentKeys.detail(document.id),
      });
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (favoriteStatusQuery.data?.is_favorite) {
        return unfavoriteDocument(document.id);
      }

      return favoriteDocument(document.id);
    },
    onSuccess: async (status) => {
      queryClient.setQueryData(favoriteKeys.status(document.id), status);
      await queryClient.invalidateQueries({
        queryKey: favoriteKeys.workspaceList(workspaceSlug),
      });
      toast(
        status.is_favorite ? 'Added to favorites' : 'Removed from favorites',
      );
    },
  });

  const archiveDocumentMutation = useMutation({
    mutationFn: async () => {
      const documentDetail = await queryClient.ensureQueryData(
        documentDetailQueryOptions(document.id),
      );

      return archiveDocument(document.id, documentDetail.version);
    },
    onSuccess: async (archivedDocument) => {
      queryClient.setQueryData(
        documentKeys.detail(document.id),
        archivedDocument,
      );
      removeCachedNavigationDocument(queryClient, workspaceSlug, document.id);
      await queryClient.invalidateQueries({
        queryKey: documentKeys.lists(workspaceSlug),
      });
      await queryClient.invalidateQueries({
        queryKey: favoriteKeys.workspaceList(workspaceSlug),
      });
      toast('Moved to trash');
    },
  });

  const handleCreateSubdocument = () => {
    void createSubdocumentMutation.mutateAsync();
  };

  const handleDuplicate = () => {
    void duplicateDocumentMutation.mutateAsync();
  };

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    await navigator.clipboard.writeText(
      `${window.location.origin}${workspaceRoutes.document(
        workspaceSlug,
        document.public_id,
        document.title,
      )}`,
    );
    toast('Copied page link to clipboard');
  };

  const handleToggleFavorite = () => {
    void favoriteMutation.mutateAsync();
  };

  const handleArchive = () => {
    void (async () => {
      const documentDetail = await queryClient.ensureQueryData(
        documentDetailQueryOptions(document.id),
      );
      const nextDocument = isActive
        ? await resolveArchiveDestination({
          document: documentDetail,
          queryClient,
          workspaceSlug,
        })
        : null;

      await archiveDocumentMutation.mutateAsync();

      if (isActive) {
        router.replace(
          nextDocument
            ? workspaceRoutes.document(
              workspaceSlug,
              nextDocument.public_id,
              nextDocument.title,
            )
            : workspaceRoutes.detail(workspaceSlug),
        );
      }
    })();
  };

  const isFavorite = favoriteStatusQuery.data?.is_favorite ?? false;
  const isBusy = createSubdocumentMutation.isPending;
  const createSubdocumentButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="size-5 rounded-sm bg-transparent text-sidebar-foreground/70 hover:!bg-sidebar-accent-foreground/10 hover:text-sidebar-accent-foreground"
      aria-label="Create subdocument"
      disabled={isBusy}
      onClick={handleCreateSubdocument}
    >
      {isBusy
        ? (
          <LoadingIcon className="size-4" />
        )
        : (
          <PlusIcon className="size-4" />
        )}
    </Button>
  );

  return (
    <div
      className={cn(
        'absolute inset-y-0 right-1 z-20 flex items-center gap-0.5 rounded pr-0.5 pl-1 opacity-0 transition-opacity group-hover/menu-sub-item:opacity-100',
        isMenuOpen && 'opacity-100',
      )}
    >
      <Tooltip>
        <TooltipTrigger delay={0} render={createSubdocumentButton} />
        <TooltipContent side="bottom">Add a document inside</TooltipContent>
      </Tooltip>

      <DropdownMenu onOpenChange={setIsMenuOpen}>
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={
              <DropdownMenuTrigger
                className={cn(
                  'flex size-5 items-center justify-center rounded-sm bg-transparent text-sidebar-foreground/70 outline-hidden transition-colors hover:bg-sidebar-accent-foreground/10 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring aria-expanded:bg-sidebar-accent-foreground/10 aria-expanded:text-sidebar-accent-foreground',
                )}
              >
                <EllipsisIcon className="size-4" />
                <span className="sr-only">Open document actions</span>
              </DropdownMenuTrigger>
            }
          />
          <TooltipContent side="bottom">
            Delete, duplicate, and more...
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          side="right"
          sideOffset={8}
          className="w-auto min-w-48"
        >
          <DropdownMenuItem
            disabled={duplicateDocumentMutation.isPending}
            onClick={handleDuplicate}
          >
            <CopyIcon className="size-4" />
            <span>
              {duplicateDocumentMutation.isPending
                ? 'Duplicating...'
                : 'Duplicate'}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void handleCopyLink()}>
            <LinkIcon className="size-4" />
            <span>Copy link</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={
              favoriteMutation.isPending || favoriteStatusQuery.isLoading
            }
            onClick={handleToggleFavorite}
          >
            <StarIcon
              className={cn(
                'size-4',
                isFavorite && 'fill-current text-amber-300',
              )}
            />
            <span>
              {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="!text-foreground focus:bg-accent focus:!text-destructive dark:focus:bg-accent [&_svg]:!text-muted-foreground focus:[&_svg]:!text-destructive data-disabled:[&_svg]:!text-muted-foreground"
            disabled={archiveDocumentMutation.isPending}
            onClick={handleArchive}
          >
            <Trash2Icon className="size-4" />
            <span>
              {archiveDocumentMutation.isPending
                ? 'Moving to Trash...'
                : 'Move to Trash'}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function orderDocuments(items: DocumentNavigationNode[]) {
  return [...items].sort((left, right) => right.sort_key - left.sort_key);
}

function getNearestDocument(
  items: DocumentNavigationNode[],
  currentDocumentId: string,
) {
  const orderedItems = orderDocuments(items);
  const currentIndex = orderedItems.findIndex(
    (item) => item.id === currentDocumentId,
  );

  if (currentIndex === -1) {
    return orderedItems[0] ?? null;
  }

  return (
    orderedItems[currentIndex - 1] ?? orderedItems[currentIndex + 1] ?? null
  );
}

async function resolveArchiveDestination({
  document,
  queryClient,
  workspaceSlug,
}: {
  document: Document;
  queryClient: QueryClient;
  workspaceSlug: string;
}) {
  if (document.parent_document_id) {
    const siblingPage = await queryClient.ensureQueryData(
      workspaceDocumentChildrenQueryOptions(
        workspaceSlug,
        document.parent_document_id,
      ),
    );
    const siblingDocument = getNearestDocument(siblingPage.items, document.id);

    if (siblingDocument) {
      return siblingDocument;
    }

    return queryClient.ensureQueryData(
      documentDetailQueryOptions(document.parent_document_id),
    );
  }

  const rootNavigation = await queryClient.ensureQueryData(
    workspaceDocumentRootQueryOptions(workspaceSlug),
  );
  const rootItems = getRootNavigationItems(
    rootNavigation,
    document.teamspace_id,
  );

  return getNearestDocument(rootItems, document.id);
}

function getRootNavigationItems(
  navigation: WorkspaceDocumentNavigation,
  teamspaceId?: string,
) {
  if (!teamspaceId) {
    return navigation.private_documents.items;
  }

  return (
    navigation.teamspaces.find((teamspace) => teamspace.id === teamspaceId)
      ?.documents.items ?? []
  );
}
