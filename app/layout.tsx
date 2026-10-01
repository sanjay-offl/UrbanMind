import type { Metadata } from 'next';
import './globals.css';
import { WardProvider } from '@/lib/ward-context';
import { I18nProvider } from '@/lib/i18n-context';
import AppShell from '@/components/auth/app-shell';
import { Toaster } from '@/components/ui/toast';

export const metadata: Metadata = {
  metadataBase: new URL('https://urbanmind-eight.vercel.app'),
  title: 'UrbanMind – Citizen Complaint Intelligence',
  description: 'AI-powered civic grievance dashboard for India.',
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'UrbanMind',
    title: 'UrbanMind – Citizen Complaint Intelligence',
    description: 'AI-powered civic grievance dashboard for India.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'UrbanMind',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UrbanMind – Citizen Complaint Intelligence',
    description: 'AI-powered civic grievance dashboard for India.',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/image.png" type="image/png" />
        <link rel="apple-touch-icon" href="/image.png" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
      </head>
      <body>
        <WardProvider>
          <I18nProvider>
            <AppShell>{children}</AppShell>
            <Toaster />
          </I18nProvider>
        </WardProvider>
      </body>
    </html>
  );
}
