'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isLoginPage = pathname === '/login';
  const isPublicPage = isLoginPage || pathname === '/submit';

  useEffect(() => {
    const session = getSession();
    setAuthed(Boolean(session));
    if (!session && !isPublicPage) {
      router.replace('/login');
    }
  }, [pathname, router, isPublicPage]);

  // Never leave the mobile drawer open across route changes.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Escape closes the drawer; body scroll is locked while it is open.
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!authed) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Desktop sidebar — unchanged behaviour */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar — off-canvas, controlled by the header hamburger */}
      <div
        className={`fixed inset-0 z-[60] md:hidden ${
          mobileNavOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!mobileNavOpen}
      >
        <div
          onClick={() => setMobileNavOpen(false)}
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-200 ${
            mobileNavOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          id="urbanmind-mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={`absolute left-0 top-0 h-full max-w-[280px] shadow-2xl transition-transform duration-200 ease-out ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          sidebarOpen={mobileNavOpen}
          onToggleSidebar={() => setMobileNavOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
