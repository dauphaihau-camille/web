import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Navigate } from '@/app/_components/navigate/navigate';
import { buttonVariants } from '@shared/components/ui/button';
import { getAppSignupUrl } from '@/lib/app-url';
import { cn } from '@shared/lib/utils';

export default function HomePage() {
  return (
    <main className="px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Navigate />

        <div className="mx-auto max-w-lg py-20 text-center md:pt-28">
          <h1 className="mb-4 px-12 text-5xl font-bold">
            The simplest way to keep notes
          </h1>
          <h5 className="text-xl">
            Remember everything and tackle any project with <br /> your notes,
            tasks, and schedule all in one place.
          </h5>
          <Link
            href={getAppSignupUrl()}
            prefetch
            className={cn(buttonVariants({ size: 'lg' }), 'mt-6 inline-flex')}
          >
            Get start for free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Image
          src="/marketing/app-workspace.png"
          width={3383}
          height={2125}
          alt="Camille app workspace"
          quality={100}
          priority
        />
      </div>
    </main>
  );
}
