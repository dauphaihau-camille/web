import { LoaderCircle } from 'lucide-react';

export default function LoadingFullPage() {
  return (
    <div className="grid h-screen place-items-center">
      <LoaderCircle className="h-6 w-6 animate-spin text-foreground" />
    </div>
  );
}
