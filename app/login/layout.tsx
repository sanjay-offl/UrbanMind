import type { Metadata } from 'next';

const title = 'Login – UrbanMind';
const description = 'AI-powered civic grievance dashboard for India.';

export const metadata: Metadata = {
  title,
  openGraph: {
    type: 'website',
    url: '/login',
    siteName: 'UrbanMind',
    title,
    description,
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
    title,
    description,
    images: ['/og-image.jpg'],
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}