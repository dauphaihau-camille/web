import type { z } from 'zod';
import type { searchDocumentSchema } from './search.schemas';

export type SearchDocument = z.infer<typeof searchDocumentSchema>;
