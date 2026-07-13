function normalizeUrl(value?: string) {
  return value?.replace(/\/+$/, '');
}

function normalizePathSegment(value?: string) {
  return value?.replace(/^\/+|\/+$/g, '');
}

function buildApiBaseUrl(origin?: string, version?: string) {
  if (!origin) {
    return undefined;
  }

  if (version && origin.endsWith(`/${version}`)) {
    return origin;
  }

  return version ? `${origin}/${version}` : origin;
}

function extractApiOrigin(value?: string) {
  const normalizedValue = normalizeUrl(value);

  if (!normalizedValue) {
    return undefined;
  }

  try {
    return new URL(normalizedValue).origin;
  }
  catch {
    return normalizedValue;
  }
}

const configuredApiUrl = normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
const apiOrigin = extractApiOrigin(process.env.NEXT_PUBLIC_API_BASE_URL);
const apiVersion = normalizePathSegment(process.env.NEXT_PUBLIC_API_VERSION) || 'v1';

export const publicEnv = {
  apiBaseUrl: buildApiBaseUrl(configuredApiUrl, apiVersion),
  apiOrigin,
  apiVersion,
  marketingHost: normalizeUrl(process.env.NEXT_PUBLIC_MARKETING_HOST) || 'http://localhost:4001',
} as const;
