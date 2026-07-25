import { z } from 'zod';

export const workspacePreferenceSchema = z.object({
  workspace_id: z.string().min(1),
  navigation: z.object({
    expanded_document_ids_by_scope: z.record(
      z.string().min(1),
      z.array(z.string().min(1)),
    ),
  }),
  activity: z.object({
    last_active_at: z.string().datetime().nullable(),
  }),
});

export const updateWorkspacePreferenceSchema = z.object({
  navigation: z.object({
    expanded_document_ids_by_scope: z.record(
      z.string().min(1),
      z.array(z.string().min(1)),
    ),
  }),
});
