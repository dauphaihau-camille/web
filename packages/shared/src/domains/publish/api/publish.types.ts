import type { z } from 'zod';
import type {
  publicDocumentSchema,
  publishStatusSchema,
} from './publish.schemas';

export type PublishStatus = z.infer<typeof publishStatusSchema>;
export type PublicDocument = z.infer<typeof publicDocumentSchema>;
