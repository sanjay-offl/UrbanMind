import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { WardProvider } from '@/lib/ward-context';
import AppShell from '@/components/auth/app-shell';
import { Toaster } from '@/components/ui/toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'UrbanMind — Citizen Complaint Intelligence',
  description: 'AI-powered citizen grievance intelligence platform',
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
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
      </head>
      <body className={inter.className}>
        {/* Animated orb background */}
        <div
          className="orb-container"
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div
            className="orb-1"
            style={{
              position: 'absolute',
              top: '-200px',
              left: '-200px',
              width: '700px',
              height: '700px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(154,23,80,0.18) 0%, transparent 70%)',
              animation: 'orbFloat1 20s ease-in-out infinite',
            }}
          />
          <div
            className="orb-2"
            style={{
              position: 'absolute',
              bottom: '-150px',
              right: '-150px',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(238,76,124,0.12) 0%, transparent 70%)',
              animation: 'orbFloat2 25s ease-in-out infinite',
            }}
          />
          <div
            className="orb-3"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(227,175,188,0.08) 0%, transparent 70%)',
              animation: 'orbFloat3 18s ease-in-out infinite',
            }}
          />
        </div>
        <ThemeProvider>
          <WardProvider>
            <AppShell>{children}</AppShell>
            <Toaster position="bottom-right" />
          </WardProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
