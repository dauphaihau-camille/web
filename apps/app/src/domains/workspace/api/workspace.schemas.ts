import { z } from 'zod';

import {
  isReservedWorkspaceDomain,
  workspaceDomainPattern,
} from './workspace-domain';

export const workspaceIdSchema = z.string().min(1);
export const workspaceRoleSchema = z.enum(['owner', 'admin', 'member']);

export const workspaceSchema = z.object({
  id: workspaceIdSchema,
  version: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional().transform((value) => value ?? undefined),
  current_user_role: workspaceRoleSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const workspaceMemberSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  user_id: z.string().min(1),
  email: z.string().email(),
  display_name: z.string().optional(),
  avatar: z.string().optional(),
  role: workspaceRoleSchema,
  joined_at: z.string(),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string()
    .min(3, 'Domain must be 3 to 32 characters')
    .max(32, 'Domain must be 3 to 32 characters')
    .regex(workspaceDomainPattern, 'Domain invalid')
    .refine((value) => !isReservedWorkspaceDomain(value), 'Domain not allowed'),
  description: z.string().max(280).optional(),
});

export const updateWorkspaceSchema = z.object({
  version: z.number().int().positive(),
  name: z.string().min(2).max(80).optional(),
  slug: z.string()
    .min(3, 'Domain must be 3 to 32 characters')
    .max(32, 'Domain must be 3 to 32 characters')
    .regex(workspaceDomainPattern, 'Domain invalid')
    .refine((value) => !isReservedWorkspaceDomain(value), 'Domain not allowed')
    .optional(),
  description: z.string().max(280).optional(),
});

export const addWorkspaceMemberSchema = z.object({
  email: z.string().email(),
  role: workspaceRoleSchema.default('member'),
});

export const updateWorkspaceMemberSchema = z.object({
  version: z.number().int().positive(),
  role: workspaceRoleSchema,
});

export const workspaceListSchema = z.array(workspaceSchema);
export const workspaceMemberListSchema = z.array(workspaceMemberSchema);
