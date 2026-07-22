import { z } from 'zod';

export const favoriteStatusSchema = z.object({
  document_id: z.string().min(1),
  is_favorite: z.boolean(),
});

export const favoriteDocumentAccessSchema = z.object({
  permission: z.enum(['view', 'edit', 'manage']),
  can_view: z.boolean(),
  can_edit: z.boolean(),
  can_manage: z.boolean(),
});

export const favoriteDocumentSchema = z.object({
  document_id: z.string().min(1),
  public_id: z.string().min(1),
  workspace_id: z.string().min(1),
  teamspace_id: z.string().optional(),
  parent_document_id: z.string().optional(),
  title: z.string(),
  sort_key: z.number().int(),
  has_children: z.boolean(),
  has_content: z.boolean(),
  favorited_at: z.string(),
  access: favoriteDocumentAccessSchema,
});
