import { authRoutes, getPostLoginRedirectTarget } from '@shared/domains/auth';

import { OAuthPopupClient } from './_components/oauth-popup-client';

type OAuthPopupPageProps = {
  searchParams?: Promise<{
    redirectTo?: string | string[];
  }>;
};

export default async function OAuthPopupPage({ searchParams }: OAuthPopupPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectTo = Array.isArray(resolvedSearchParams?.redirectTo)
    ? resolvedSearchParams.redirectTo[0]
    : resolvedSearchParams?.redirectTo;
  const redirectTarget = getPostLoginRedirectTarget(redirectTo);

  return (
    <OAuthPopupClient
      loginPath={authRoutes.login()}
      redirectTarget={redirectTarget}
    />
  );
}
