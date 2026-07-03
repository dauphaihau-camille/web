import { z } from 'zod';

export const workspacePreferenceSchema = z.object({
  workspace_id: z.string().min(1),
  navigation: z.object({
    expanded_document_ids: z.array(z.string().min(1)),
  }),
});

export const updateWorkspacePreferenceSchema = z.object({
  navigation: z.object({
    expanded_document_ids: z.array(z.string().min(1)),
  }),
});
