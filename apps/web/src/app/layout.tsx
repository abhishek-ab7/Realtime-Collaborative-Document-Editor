import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Geist } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/sonner';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Collabdoc — Collaborative Document Editor',
    template: '%s | Collabdoc',
  },
  description:
    'Real-time collaborative document editing with conflict-free synchronization, live cursors, and version history.',
  keywords: ['collaborative editing', 'real-time', 'document editor', 'CRDT'],
  authors: [{ name: 'Collabdoc Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Collabdoc',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, jetbrainsMono.variable, 'font-sans', geist.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[var(--color-bg-primary)] antialiased">
        <SessionProvider>{children}</SessionProvider>
        <Toaster position="top-right" closeButton richColors />
      </body>
    </html>
  );
}
