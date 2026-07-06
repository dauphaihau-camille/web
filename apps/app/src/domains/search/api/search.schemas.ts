import { z } from 'zod';

export const searchDocumentSchema = z.object({
  document_id: z.string().min(1),
  public_id: z.string().min(1),
  workspace_id: z.string().min(1),
  teamspace_id: z.string().optional(),
  parent_document_id: z.string().optional(),
  title: z.string(),
  has_content: z.boolean(),
  breadcrumb_path: z.array(z.string()),
  updated_by_name: z.string().optional(),
  matched_text: z.string().optional(),
  updated_at: z.string(),
  visited_at: z.string().optional(),
});
