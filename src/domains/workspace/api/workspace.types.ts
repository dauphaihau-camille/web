import type { z } from 'zod';

import type { workspaceIdSchema, workspaceSchema } from './workspace.schemas';

export type WorkspaceId = z.infer<typeof workspaceIdSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
