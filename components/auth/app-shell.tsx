'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import GeographyToolbar from '@/components/layout/geography-toolbar';

const DATA_PAGES = ['/dashboard', '/grievances', '/map', '/trends', '/reports'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isLoginPage = pathname === '/login';
  const isPublicPage = isLoginPage || pathname === '/';

  useEffect(() => {
    const session = getSession();
    setAuthed(Boolean(session));
    if (!session && !isPublicPage) {
      router.replace('/login');
    }
  }, [pathname, router, isPublicPage]);

  // Never leave the mobile drawer open across route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Escape key closes the drawer; lock body scroll when open
  useEffect(() => {
    if (!mobileNavOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileNavOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  if (isPublicPage) return <>{children}</>;

  if (authed === null) {
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
          <span>Loading UrbanMind Intelligence...</span>
        </div>
      </div>
    );
  }

  if (!authed) return null;

  const showGeographyToolbar = DATA_PAGES.includes(pathname);

  return (
    <div className="lg:grid lg:grid-cols-[264px_1fr] h-screen w-full overflow-hidden bg-[var(--bg)]">
      {/* Exactly ONE desktop sidebar instance in the grid */}
      <Sidebar />

      {/* Exactly ONE mobile drawer instance (opened only via hamburger on <1024px) */}
      <Sidebar
        isMobileDrawer
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onNavigate={() => setMobileNavOpen(false)}
      />

      {/* Main Content Column with Header */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
        <Header
          sidebarOpen={mobileNavOpen}
          onToggleSidebar={() => setMobileNavOpen((v) => !v)}
        />
        {/* Only the main content area scrolls, with scroll-padding-top: 80px */}
        <main className="flex-1 overflow-y-auto scroll-pt-[80px] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {showGeographyToolbar && <GeographyToolbar />}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
