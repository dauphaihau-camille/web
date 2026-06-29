import { z } from 'zod';

export const workspaceIdSchema = z.string();

export const workspaceSchema = z.object({
  id: workspaceIdSchema,
  name: z.string(),
  slug: z.string(),
});

export const workspaceListSchema = z.array(workspaceSchema);
