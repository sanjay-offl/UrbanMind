'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n-context';
import type { TranslationKey, SupportedLocale } from '@/lib/i18n';
import BrandLogo from '@/components/brand-logo';

interface NavItemConfig {
  href: string;
  icon: string;
  labelKey: TranslationKey;
  permission?: string;
  badge?: string;
}

const navItems: NavItemConfig[] = [
  {
    href: '/dashboard',
    icon: 'ti-layout-dashboard',
    labelKey: 'dashboard',
    permission: 'view_dashboard',
  },
  {
    href: '/grievances',
    icon: 'ti-message-report',
    labelKey: 'grievances',
    permission: 'view_grievances',
  },
  {
    href: '/submit',
    icon: 'ti-edit',
    labelKey: 'submit',
  },
  {
    href: '/upload',
    icon: 'ti-upload',
    labelKey: 'upload',
    permission: 'upload_complaints',
  },
  {
    href: '/map',
    icon: 'ti-map-2',
    labelKey: 'map',
    permission: 'view_map',
  },
  {
    href: '/trends',
    icon: 'ti-chart-line',
    labelKey: 'trends',
    permission: 'view_trends',
  },
  {
    href: '/agent',
    icon: 'ti-sparkles',
    labelKey: 'assistant',
    permission: 'use_agent',
  },
  {
    href: '/reports',
    icon: 'ti-file-analytics',
    labelKey: 'reports',
    permission: 'view_reports',
  },
  {
    href: '/data-sources',
    icon: 'ti-database',
    labelKey: 'dataSources',
  },
  {
    href: '/settings',
    icon: 'ti-settings',
    labelKey: 'settings',
  },
];

export default function Sidebar({
  isMobileDrawer = false,
  isOpen = false,
  onClose,
  onNavigate,
}: {
  isMobileDrawer?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { can } = useAuth();
  const { t, locale, setLocale } = useI18n();

  // Escape key handler for mobile drawer
  useEffect(() => {
    if (!isMobileDrawer || !isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawer, isOpen, onClose]);

  const visibleItems = navItems.filter((item) => !item.permission || can(item.permission));

  const sidebarBody = (
    <div className="flex h-full w-[264px] flex-col bg-[var(--surface)] border-r border-[var(--border)]">
      {/* 1. Header (64px) */}
      <div className="flex h-16 shrink-0 items-center border-b border-[var(--border)] px-4">
        <BrandLogo size="md" showText showTagline={false} />
      </div>

      {/* 2. Language Row */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-xs">
        <span className="font-medium text-[var(--text-muted)]">{t('selectLanguage')}:</span>
        <div className="flex items-center gap-1">
          {(
            [
              { code: 'en', label: 'EN' },
              { code: 'ta', label: 'தமிழ்' },
              { code: 'hi', label: 'हिन्दी' },
              { code: 'bn', label: 'বাংলা' },
            ] as const
          ).map((item) => {
            const active = locale === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setLocale(item.code as SupportedLocale)}
                className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border border-[var(--blue)] bg-[var(--surface)] text-[var(--primary)]'
                    : 'border border-transparent text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Navigation (middle, flex-1, overflow-y: auto) */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const label = t(item.labelKey);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={label}
              onClick={() => {
                if (onNavigate) onNavigate();
                if (onClose) onClose();
              }}
              style={{ height: '40px' }}
              className={`flex items-center gap-3 rounded-lg px-3 text-[13.5px] transition-colors duration-150 ${
                active
                  ? 'bg-[var(--primary-soft)] font-semibold text-[var(--primary)]'
                  : 'font-normal text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]'
              }`}
            >
              <i
                className={`ti ${item.icon} text-lg shrink-0 ${
                  active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
                }`}
              />
              <span className="truncate leading-none">{label}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-[var(--primary-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 4. Footer pinned to bottom (margin-top: auto) */}
      <div className="mt-auto shrink-0 border-t border-[var(--border)] px-4 py-3 text-[11px] text-[var(--text-muted)]">
        <div className="flex items-center justify-between">
          <span>India Architecture</span>
          <span className="font-mono text-[13px] text-[var(--text-muted)]">v0.1.0</span>
        </div>
      </div>
    </div>
  );

  // If this instance is rendered as mobile drawer
  if (isMobileDrawer) {
    if (!isOpen) return null;
    return (
      <div
        id="urbanmind-mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="fixed inset-0 z-50 flex lg:hidden"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Drawer panel */}
        <div className="relative z-10 flex h-full w-[264px] flex-col shadow-xl animate-in slide-in-from-left duration-200">
          {sidebarBody}
        </div>
      </div>
    );
  }

  // Desktop Persistent Sidebar (width 264px, position sticky, top 0, height 100vh)
  return (
    <aside className="sticky top-0 h-screen w-[264px] shrink-0 hidden lg:flex flex-col">
      {sidebarBody}
    </aside>
  );
}
