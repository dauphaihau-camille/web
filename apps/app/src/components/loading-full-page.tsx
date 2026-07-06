import { cn } from '@/lib/utils';

import { LoadingIcon } from './loading-icon';

type LoadingFullPageProps = {
  overlay?: boolean;
};

export default function LoadingFullPage({ overlay = false }: LoadingFullPageProps) {
  return (
    <div
      className={cn(
        'grid h-screen place-items-center',
        overlay && 'fixed inset-0 z-100 bg-background',
      )}
    >
      <LoadingIcon />
    </div>
  );
}
