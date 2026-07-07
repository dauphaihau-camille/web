import { workspaceRoutes } from '../../workspace/workspace-routes';

const DEFAULT_POST_LOGIN_PATH = workspaceRoutes.entry();

export function getSafeRedirectTarget(redirectTarget: string | null | undefined) {
  if (!redirectTarget) {
    return null;
  }

  if (!redirectTarget.startsWith('/') || redirectTarget.startsWith('//')) {
    return null;
  }

  return redirectTarget;
}

export function getPostLoginRedirectTarget(redirectTarget: string | null | undefined) {
  return getSafeRedirectTarget(redirectTarget) ?? DEFAULT_POST_LOGIN_PATH;
}
