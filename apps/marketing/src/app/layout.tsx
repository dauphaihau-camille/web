import { Geist, Geist_Mono } from 'next/font/google';

import AppProviders from '@/components/app-providers';
import './globals.css';
import { cn } from '@shared/lib/utils';

const geist = Geist({ subsets:['latin'],variable:'--font-sans' });

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('antialiased', fontMono.variable, 'font-sans', geist.variable)}
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
