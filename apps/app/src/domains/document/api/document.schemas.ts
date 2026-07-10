import { z } from 'zod';

export const documentIdSchema = z.string().min(1);
export const documentContentFormatSchema = z.literal('blocknote_v1');
export const documentBreadcrumbItemSchema = z.object({
  id: documentIdSchema,
  public_id: z.string().min(1),
  title: z.string(),
});

export const documentSchema = z.object({
  id: documentIdSchema,
  public_id: z.string().min(1),
  version: z.number().int().positive(),
  workspace_id: z.string().min(1),
  teamspace_id: z.string().nullable().optional().transform((value) => value ?? undefined),
  parent_document_id: z.string().nullable().optional().transform((value) => value ?? undefined),
  title: z.string(),
  content_format: documentContentFormatSchema,
  content: z.array(z.unknown()),
  sort_key: z.number().int(),
  archived_at: z.string().optional(),
  archived_by_name: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  is_favorite: z.boolean().optional(),
  published_document_id: z.string().optional(),
  public_path: z.string().optional(),
  breadcrumb: z.array(documentBreadcrumbItemSchema).optional(),
});

export const documentNavigationNodeSchema = z.object({
  id: documentIdSchema,
  public_id: z.string().min(1),
  title: z.string(),
  teamspace_id: z.string().nullable().optional().transform((value) => value ?? undefined),
  parent_document_id: z.string().nullable().optional().transform((value) => value ?? undefined),
  sort_key: z.number().int(),
  has_children: z.boolean(),
  has_content: z.boolean(),
  is_favorite: z.boolean(),
});

export const documentNavigationPageSchema = z.object({
  items: z.array(documentNavigationNodeSchema),
  next_cursor: z.string().optional(),
});

export const archivedDocumentListItemSchema = z.object({
  id: documentIdSchema,
  public_id: z.string().min(1),
  version: z.number().int().positive(),
  title: z.string(),
  has_content: z.boolean(),
  breadcrumb_path: z.array(z.string()),
  archived_at: z.string(),
});

export const archivedDocumentListPageSchema = z.object({
  items: z.array(archivedDocumentListItemSchema),
  next_cursor: z.string().optional(),
});

export const teamspaceDocumentNavigationSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string().optional(),
  documents: documentNavigationPageSchema,
});

export const workspaceDocumentNavigationSchema = z.object({
  private_documents: documentNavigationPageSchema,
  teamspaces: z.array(teamspaceDocumentNavigationSchema),
});

export const createDocumentSchema = z.object({
  workspace_id: z.string().min(1),
  teamspace_id: z.string().optional(),
  parent_document_id: z.string().optional(),
  title: z.string().max(180).optional(),
  content_format: documentContentFormatSchema.optional(),
  content: z.array(z.unknown()).optional(),
});

export const createSubdocCommandResultSchema = z.object({
  parent_document: documentSchema,
  child_document: documentSchema,
});

export const archiveSubdocCommandResultSchema = z.object({
  parent_document: documentSchema,
  archived_child_document: documentSchema,
});

export const createSubdocCommandSchema = z.object({
  anchor_block_id: z.string().min(1).optional(),
  slash_command_text: z.string().min(1).optional(),
  version: z.number().int().positive().optional(),
  content: z.array(z.unknown()).optional(),
});

export const archiveSubdocCommandSchema = z.object({
  subdocument_id: z.string().min(1),
  version: z.number().int().positive(),
  content: z.array(z.unknown()).optional(),
});

export const updateDocumentSchema = z.object({
  version: z.number().int().positive(),
  title: z.string().max(180).optional(),
  content_format: documentContentFormatSchema.optional(),
  content: z.array(z.unknown()).optional(),
});

export const moveDocumentSchema = z.object({
  version: z.number().int().positive(),
  teamspace_id: z.string().nullable().optional(),
  parent_document_id: z.string().nullable().optional(),
  index: z.number().int().min(0).optional(),
});
