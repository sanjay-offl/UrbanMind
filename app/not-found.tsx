import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="civic-card max-w-md p-8">
        <h2 className="text-[24px] font-bold text-[var(--text)]">Page Not Found</h2>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          The requested civic page or resource could not be found.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
