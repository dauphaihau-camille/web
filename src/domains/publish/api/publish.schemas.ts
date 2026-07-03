import { z } from 'zod';

export const publishStatusSchema = z.object({
  document_id: z.string().min(1),
  published_document_id: z.string().optional(),
  public_path: z.string().optional(),
  published_at: z.string().optional(),
});

export const publicDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  content_format: z.literal('blocknote_v1'),
  content: z.array(z.unknown()),
  published_at: z.string(),
  updated_at: z.string(),
});
