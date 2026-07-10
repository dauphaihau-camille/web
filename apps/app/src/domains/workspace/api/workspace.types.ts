import type { z } from 'zod';

import type {
  addWorkspaceMemberSchema,
  createWorkspaceSchema,
  updateWorkspaceMemberSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
  workspaceMemberSchema,
  workspaceRoleSchema,
  workspaceSchema,
} from './workspace.schemas';

export type WorkspaceId = z.infer<typeof workspaceIdSchema>;
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;
export type UpdateWorkspaceMemberInput = z.infer<typeof updateWorkspaceMemberSchema>;
