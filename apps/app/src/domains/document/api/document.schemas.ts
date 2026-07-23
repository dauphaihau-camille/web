import { z } from 'zod';

export const documentIdSchema = z.string().min(1);
export const documentContentFormatSchema = z.literal('blocknote_v1');
export const documentBreadcrumbItemSchema = z.object({
  id: documentIdSchema,
  public_id: z.string().min(1),
  title: z.string(),
});
export const documentAccessPermissionSchema = z.enum(['none', 'view', 'edit', 'manage']);
export const documentAccessGrantPermissionSchema = z.enum(['view', 'comment', 'edit', 'manage']);
const nullableDocumentAccessGrantPermissionSchema = z.preprocess(
  (value) => value ?? undefined,
  documentAccessGrantPermissionSchema.optional(),
);
export const documentAccessScopeSchema = z.enum(['private', 'shared', 'teamspace']);
export const documentAccessSchema = z.object({
  scope: documentAccessScopeSchema,
  permission: documentAccessPermissionSchema,
  can_view: z.boolean(),
  can_edit: z.boolean(),
  can_manage: z.boolean(),
  workspace_member_permission: nullableDocumentAccessGrantPermissionSchema,
});
export const documentOwnerUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  display_name: z.string().optional(),
});

export const documentSchema = z.object({
  id: documentIdSchema,
  public_id: z.string().min(1),
  version: z.number().int().positive(),
  workspace_id: z.string().min(1),
  owner_user_id: z.string().min(1),
  owner_user: documentOwnerUserSchema.optional(),
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
  access: documentAccessSchema.optional(),
});

export const documentCollaboratorUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  display_name: z.string().optional(),
});

export const documentCollaboratorSchema = z.object({
  id: z.string().min(1),
  document_id: documentIdSchema,
  user: documentCollaboratorUserSchema,
  permission: documentAccessGrantPermissionSchema,
  granted_by_user_id: z.string().min(1),
  created_at: z.string(),
  updated_at: z.string(),
});

export const documentCollaboratorListSchema = z.array(documentCollaboratorSchema);

export const shareDocumentSchema = z.object({
  user_id: z.string().min(1),
  permission: documentAccessGrantPermissionSchema,
});

export const shareDocumentsSchema = z.object({
  grants: z.array(shareDocumentSchema).min(1),
});

export const shareDocumentFailureSchema = z.object({
  user_id: z.string().min(1),
  reason: z.enum(['workspace_user_not_found']),
});

export const shareDocumentsResponseSchema = z.object({
  collaborators: documentCollaboratorListSchema,
  failed: z.array(shareDocumentFailureSchema),
});

export const documentAccessSettingsSchema = z.object({
  document_id: documentIdSchema,
  workspace_member_permission: nullableDocumentAccessGrantPermissionSchema,
  updated_by_user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const updateDocumentAccessSettingsSchema = z.object({
  workspace_member_permission: documentAccessGrantPermissionSchema.nullish(),
});

export const documentNavigationNodeSchema = z.object({
  id: documentIdSchema,
  public_id: z.string().min(1),
  access_scope: documentAccessScopeSchema.optional(),
  is_owned_by_current_user: z.boolean().optional(),
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
  shared_documents: documentNavigationPageSchema.optional().default({
    items: [],
    next_cursor: undefined,
  }),
  teamspaces: z.array(teamspaceDocumentNavigationSchema),
});

export const createRootDocumentSchema = z.object({
  workspace_id: z.string().min(1),
  teamspace_id: z.string().optional(),
  title: z.string().max(180).optional(),
  content_format: documentContentFormatSchema.optional(),
  content: z.array(z.unknown()).optional(),
});

export const createSubdocumentCommandResultSchema = z.object({
  parent_document: documentSchema,
  child_document: documentSchema,
});

export const archiveSubdocCommandResultSchema = z.object({
  parent_document: documentSchema,
  archived_child_document: documentSchema,
});

export const createSubdocumentCommandSchema = z.object({
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
