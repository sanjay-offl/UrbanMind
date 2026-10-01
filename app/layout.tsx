import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { WardProvider } from '@/lib/ward-context';
import { I18nProvider } from '@/lib/i18n-context';
import AppShell from '@/components/auth/app-shell';
import { Toaster } from '@/components/ui/toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  preload: false,
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'UrbanMind — From Citizen Voice to National Priorities',
  description:
    'AI-powered civic intelligence platform turning citizen grievances and public infrastructure data into actionable development priorities for decision makers.',
  openGraph: {
    title: 'UrbanMind — From Citizen Voice to National Priorities',
    description:
      'AI-powered civic intelligence platform turning citizen grievances and public infrastructure data into actionable development priorities.',
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
      className={`${inter.variable} ${mono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
      </head>
      <body className={inter.className} style={{ background: '#FFFFFF', color: '#202124' }}>
        <WardProvider>
          <I18nProvider>
            <AppShell>{children}</AppShell>
            <Toaster position="bottom-right" />
          </I18nProvider>
        </WardProvider>
      </body>
    </html>
  );
}
