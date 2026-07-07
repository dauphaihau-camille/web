const WORKSPACE_ENTRY_PATH = '/workspace';
const DOCUMENT_ID_SUFFIX_PATTERN = /([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const DOCUMENT_ID_PATTERN = /^([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

function slugifyDocumentTitle(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || 'untitled';
}

export function parseDocumentRouteSegment(documentSegment: string) {
  const match = documentSegment.match(DOCUMENT_ID_SUFFIX_PATTERN);

  if (!match) {
    return documentSegment;
  }

  return match[1];
}

export function isDocumentRouteId(value: string) {
  return DOCUMENT_ID_PATTERN.test(value);
}

export const workspaceRoutes = {
  entry() {
    return WORKSPACE_ENTRY_PATH;
  },
  detail(workspaceSlug: string) {
    return `/${workspaceSlug}`;
  },
  document(workspaceSlug: string, documentId: string, documentTitle?: string) {
    if (!documentTitle) {
      return `/${workspaceSlug}/${documentId}`;
    }

    return `/${workspaceSlug}/${slugifyDocumentTitle(documentTitle)}-${documentId}`;
  },
  settings(workspaceSlug: string) {
    return `/${workspaceSlug}/settings`;
  },
  settingsMembers(workspaceSlug: string) {
    return `/${workspaceSlug}/settings/members`;
  },
} as const;
