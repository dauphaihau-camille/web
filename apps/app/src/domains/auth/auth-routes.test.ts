import {
  describe, expect, it, vi, 
} from 'vitest';

vi.mock('@shared/lib/public-env', () => ({
  publicEnv: {
    apiBaseUrl: undefined,
  },
}));

import { authRoutes, hasLoggedOutSearchParam, resolveWakeNextPath } from './auth-routes';

describe('authRoutes', () => {
  it('builds a wake route with the next path', () => {
    expect(authRoutes.wake('/signup?redirectTo=%2Fw%2Facme')).toBe(
      '/wake?next=%2Fsignup%3FredirectTo%3D%252Fw%252Facme',
    );
  });

  it('builds a dedicated optimistic logout login route', () => {
    expect(authRoutes.loginAfterLogout()).toBe('/login?loggedOut=1');
  });

  it('builds Password Reset Request and Password Reset routes', () => {
    expect(authRoutes.forgotPassword('/w/acme')).toBe('/forgot-password?redirectTo=%2Fw%2Facme');
    expect(authRoutes.resetPassword('reset-token', '/w/acme')).toBe(
      '/reset?t=reset-token&redirectTo=%2Fw%2Facme',
    );
  });
});

describe('hasLoggedOutSearchParam', () => {
  it('detects the optimistic logout marker', () => {
    expect(hasLoggedOutSearchParam(new URLSearchParams('loggedOut=1'))).toBe(true);
  });

  it('ignores unrelated search params', () => {
    expect(hasLoggedOutSearchParam(new URLSearchParams('redirectTo=/w/acme'))).toBe(false);
  });
});

describe('resolveWakeNextPath', () => {
  it('returns the next path when it is an internal path', () => {
    expect(resolveWakeNextPath('/w/acme?tab=members')).toBe('/w/acme?tab=members');
  });

  it('falls back for missing values', () => {
    expect(resolveWakeNextPath()).toBe('/login');
  });

  it('falls back for unsafe values', () => {
    expect(resolveWakeNextPath('https://example.com', '/signup')).toBe('/signup');
    expect(resolveWakeNextPath('//example.com', '/signup')).toBe('/signup');
  });
});
