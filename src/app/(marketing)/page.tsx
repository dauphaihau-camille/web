import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { authRoutes } from '@/domains/auth';
import { cn } from '@/lib/utils';

export default function HomePage() {
  return (
    <>
      <div className="mx-auto max-w-lg py-28 text-center">
        <h1 className="mb-4 px-12 text-5xl font-bold">The simplest way to keep notes</h1>
        <h5 className="text-xl">
          Remember everything and tackle any project with <br/> your notes, tasks, and schedule all in
          one place.
        </h5>
        <Link
          href={authRoutes.login()}
          prefetch
          className={cn(buttonVariants({ size: 'lg' }), 'mt-6 inline-flex')}
        >
          Get start for free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <Image
        src="/marketing/app.png"
        width={1200}
        height={1200}
        style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}
        alt="app"
        quality={100}
        priority
      />
    </>
  );
}
