import type { z } from 'zod';

import type { ApiSchema } from '@shared/api/contracts';
import type {
  addWorkspaceMemberSchema,
  createWorkspaceSchema,
  updateWorkspaceMemberSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
  workspaceRoleSchema,
  workspaceSchema,
} from './workspace.schemas';

export type WorkspaceId = z.infer<typeof workspaceIdSchema>;
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;
export type Workspace = z.infer<typeof workspaceSchema>; // transforms nullable description to a required key, unlike the contract
export type WorkspaceMember = ApiSchema<'WorkspaceMemberResponseDto'>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;
export type UpdateWorkspaceMemberInput = z.infer<typeof updateWorkspaceMemberSchema>;
