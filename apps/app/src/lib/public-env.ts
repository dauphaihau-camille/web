function normalizeUrl(value?: string) {
  return value?.replace(/\/+$/, '');
}

export const publicEnv = {
  apiBaseUrl: normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
  marketingHost: normalizeUrl(process.env.NEXT_PUBLIC_MARKETING_HOST) || 'http://localhost:4001',
} as const;
