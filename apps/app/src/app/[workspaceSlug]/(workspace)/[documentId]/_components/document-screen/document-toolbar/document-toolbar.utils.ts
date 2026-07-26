import { publicEnv } from '@shared/lib/public-env';

export function formatRelativeTime(value: string) {
  const targetDate = new Date(value);
  const diffInSeconds = Math.round((targetDate.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(diffInSeconds);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absoluteSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.round(diffInSeconds / 60);

  if (Math.abs(diffInMinutes) < 60) {
    return formatter.format(diffInMinutes, 'minute');
  }

  const diffInHours = Math.round(diffInMinutes / 60);

  if (Math.abs(diffInHours) < 24) {
    return formatter.format(diffInHours, 'hour');
  }

  const diffInDays = Math.round(diffInHours / 24);

  return formatter.format(diffInDays, 'day');
}

export function buildDuplicateTitle(title: string) {
  const match = title.match(/^(.*) \((\d+)\)$/);

  if (!match) {
    return `${title} (1)`;
  }

  return `${match[1]} (${Number(match[2]) + 1})`;
}

export function buildPublishedDocumentUrl(path?: string) {
  if (!path) {
    return '';
  }

  return new URL(path, publicEnv.marketingHost).toString();
}
