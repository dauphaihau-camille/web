'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';

import { Button } from '@shared/components/ui/button';

const THEMES = ['light', 'dark', 'system'] as const;

// next-themes resolves the active theme on the client only. This value flips
// once after hydration without triggering the cascading-render lint rule.
const subscribe = () => () => {};

export function ThemeSwitcher() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
      {THEMES.map(value => (
        <Button
          key={value}
          size="sm"
          variant={mounted && theme === value ? 'default' : 'ghost'}
          onClick={() => setTheme(value)}
        >
          {value[0].toUpperCase() + value.slice(1)}
        </Button>
      ))}
    </div>
  );
}
