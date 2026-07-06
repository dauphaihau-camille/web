import type { z } from 'zod';

import type {
  createTeamspaceSchema,
  teamspaceSchema,
  updateTeamspaceSchema,
} from './teamspace.schemas';

export type Teamspace = z.infer<typeof teamspaceSchema>;
export type CreateTeamspaceInput = z.infer<typeof createTeamspaceSchema>;
export type UpdateTeamspaceInput = z.infer<typeof updateTeamspaceSchema>;
