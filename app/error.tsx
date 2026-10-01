'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ignore internal NEXT_REDIRECT
    if (error?.message?.includes('NEXT_REDIRECT') || (error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
      return;
    }
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="civic-card max-w-md p-8">
        <h2 className="text-[20px] font-bold text-[var(--critical)]">Something went wrong</h2>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {error.message || 'An unexpected error occurred in the application.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button type="button" onClick={() => reset()} className="btn-primary">
            Try again
          </button>
          <Link href="/dashboard" className="btn-secondary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
