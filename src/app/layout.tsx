import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body' });
const headingFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
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
        headingFont.variable,
        bodyFont.variable
      )}
    >
      <body className='min-h-full flex flex-col bg-slate-950 text-white font-sans'>
        {children}
      </body>
    </html>
  );
}
