'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)]">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] p-2 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="UrbanMind Logo"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        <span>Initializing UrbanMind...</span>
      </div>
    </div>
  );
}
