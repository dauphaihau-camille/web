import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DesignGallery } from './_components/design-gallery';

export const metadata: Metadata = {
  title: 'Design system gallery',
  robots: { index: false, follow: false },
};

export default function DesignPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <DesignGallery />;
}
