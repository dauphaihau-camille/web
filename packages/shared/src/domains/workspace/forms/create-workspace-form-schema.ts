import type { z } from 'zod';

import { createWorkspaceSchema } from '../index';

export const createWorkspaceFormSchema = createWorkspaceSchema.extend({
  name: createWorkspaceSchema.shape.name.meta({
    title: 'Workspace name',
  }),
  slug: createWorkspaceSchema.shape.slug.meta({
    title: 'Domain',
  }),
  description: createWorkspaceSchema.shape.description
    .or(createWorkspaceSchema.shape.description.unwrap().length(0))
    .transform((value) => value?.trim() || undefined),
});

export type CreateWorkspaceFormInput = z.input<typeof createWorkspaceFormSchema>;
export type CreateWorkspaceFormValues = z.output<typeof createWorkspaceFormSchema>;
