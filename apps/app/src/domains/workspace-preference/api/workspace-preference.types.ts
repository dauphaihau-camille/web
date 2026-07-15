export type WorkspacePreference = {
  workspace_id: string;
  navigation: {
    expanded_document_ids: string[];
  };
  activity: {
    last_active_at: string | null;
  };
};
