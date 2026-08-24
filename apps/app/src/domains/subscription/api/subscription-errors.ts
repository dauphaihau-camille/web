import { HTTPError } from 'ky';

export type WorkspaceBlockLimitReachedData = {
  message: string;
  code: 'workspace_block_limit_reached';
  plan: string;
  block_count: number;
  block_limit: number;
  upgrade_available: boolean;
};

export function getWorkspaceBlockLimitReachedData(
  error: unknown,
): WorkspaceBlockLimitReachedData | null {
  if (!(error instanceof HTTPError) || error.response.status !== 403) {
    return null;
  }

  const data = error.data;

  if (!isWorkspaceBlockLimitReachedData(data)) {
    return null;
  }

  return data;
}

function isWorkspaceBlockLimitReachedData(
  value: unknown,
): value is WorkspaceBlockLimitReachedData {
  return typeof value === 'object'
    && value !== null
    && 'code' in value
    && value.code === 'workspace_block_limit_reached'
    && 'message' in value
    && typeof value.message === 'string'
    && 'plan' in value
    && typeof value.plan === 'string'
    && 'block_count' in value
    && typeof value.block_count === 'number'
    && 'block_limit' in value
    && typeof value.block_limit === 'number'
    && 'upgrade_available' in value
    && typeof value.upgrade_available === 'boolean';
}
