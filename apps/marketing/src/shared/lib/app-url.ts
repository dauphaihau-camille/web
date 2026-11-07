function getAppOrigin() {
  const host = process.env.NEXT_PUBLIC_APP_HOST?.trim();

  if (!host) {
    return 'https://app.example.com';
  }

  if (host.startsWith('http://') || host.startsWith('https://')) {
    return host;
  }

  return `https://${host}`;
}

export function getAppLoginUrl() {
  return `${getAppOrigin()}/login`;
}

export function getAppSignupUrl() {
  return `${getAppOrigin()}/signup`;
}
