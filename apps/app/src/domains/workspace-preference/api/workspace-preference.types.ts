import type { ApiSchema } from '@shared/api/contracts';

export type ExpandedDocumentIdsByScope = Record<string, string[]>;

export type WorkspacePreference = ApiSchema<'WorkspacePreferenceResponseDto'>;
