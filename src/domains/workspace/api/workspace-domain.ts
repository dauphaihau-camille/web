const RESERVED_WORKSPACE_DOMAINS = new Set([
  'auth',
  'dashboard',
  'features',
  'health',
  'login',
  'logout',
  'metrics',
  'plans',
  'pricing',
  'settings',
  'solutions',
  'workspace',
]);

export const workspaceDomainPattern = /^(?!-+$)[a-z0-9-]+$/;

export function suggestWorkspaceDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

export function isReservedWorkspaceDomain(value: string): boolean {
  return RESERVED_WORKSPACE_DOMAINS.has(value.trim().toLowerCase());
}
