import type { Document } from '@/domains/document';

const STATUS_BAR_HEIGHT = 48;

export function useDocumentScreenChrome({
  activeMemberCount,
  document,
  isPublished,
}: {
  activeMemberCount: number;
  document: Document;
  isPublished: boolean;
}) {
  const isArchived = Boolean(document.archived_at);
  const showCollaborators =
    document.collaboration?.enabled === true && activeMemberCount >= 2;

  return {
    fixedHeaderOffset:
      (isPublished ? STATUS_BAR_HEIGHT : 0) +
      (isArchived ? STATUS_BAR_HEIGHT : 0),
    isArchived,
    publishedBarOffset: isArchived ? STATUS_BAR_HEIGHT : 0,
    showCollaborators,
  };
}
