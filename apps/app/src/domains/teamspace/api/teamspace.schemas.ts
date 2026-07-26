import { z } from 'zod';

export const teamspaceAccessModeSchema = z.enum(['open', 'restricted']);

export const teamspaceSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  workspace_id: z.string().min(1),
  name: z.string(),
  description: z.string().nullable().optional().transform((value) => value ?? undefined),
  access_mode: teamspaceAccessModeSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const teamspaceListSchema = z.array(teamspaceSchema);

export const createTeamspaceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(280).optional(),
  access_mode: teamspaceAccessModeSchema.optional(),
});

export const updateTeamspaceSchema = z.object({
  version: z.number().int().positive(),
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(280).optional(),
  access_mode: teamspaceAccessModeSchema.optional(),
});
