import type { z } from 'zod';
import type {
  favoriteDocumentSchema,
  favoriteStatusSchema,
} from './favorite.schemas';

export type FavoriteStatus = z.infer<typeof favoriteStatusSchema>;
export type FavoriteDocument = z.infer<typeof favoriteDocumentSchema>;
