import { z } from 'zod';

export const teamspaceSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  workspace_id: z.string().min(1),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const teamspaceListSchema = z.array(teamspaceSchema);

export const createTeamspaceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(280).optional(),
});

export const updateTeamspaceSchema = z.object({
  version: z.number().int().positive(),
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(280).optional(),
});
