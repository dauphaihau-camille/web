export type ExpandedDocumentIdsByScope = Record<string, string[]>;

export type WorkspacePreference = {
  workspace_id: string;
  navigation: {
    expanded_document_ids_by_scope: ExpandedDocumentIdsByScope;
  };
  activity: {
    last_active_at: string | null;
  };
};
