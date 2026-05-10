import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Fredoka, Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-body' });

const fredoka = Fredoka({
  variable: '--font-heading',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Revenue Leak Funnel',
  description:
    'Interactive lead-generation funnel with revenue leak calculator, email capture, and Calendly booking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={cn(
        'h-full',
        'antialiased',
        fredoka.variable,
        manrope.variable
      )}
    >
      <body className='min-h-full flex flex-col bg-slate-950 text-white font-sans'>
        {children}
      </body>
    </html>
  );
}
