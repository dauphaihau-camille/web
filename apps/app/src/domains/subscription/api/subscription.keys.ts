export const subscriptionKeys = {
  all: ['subscription'] as const,
  summary: (workspaceId: string) =>
    [...subscriptionKeys.all, 'summary', workspaceId] as const,
};
