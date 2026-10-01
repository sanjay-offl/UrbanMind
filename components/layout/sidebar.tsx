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
  isOpen,
  onClose,
  onNavigate,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { can } = useAuth();
  const { t, locale, setLocale } = useI18n();

  // Escape key handler for mobile drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const visibleItems = navItems.filter((item) => !item.permission || can(item.permission));

  const content = (
    <aside className="flex h-full w-[256px] flex-col border-r border-[#E8EAED] bg-white">
      {/* 1. Official Brand Block (Appears once: desktop sidebar top, mobile header) */}
      <div className="flex h-14 items-center border-b border-[#E8EAED] px-4">
        <BrandLogo size="md" showText showTagline={false} />
      </div>

      {/* 2. Language Row (EN, தமிழ், हिन्दी) */}
      <div className="flex items-center justify-between border-b border-[#E8EAED] bg-[#F8FAFC] px-4 py-2 text-xs">
        <span className="font-medium text-[#5F6368]">{t('selectLanguage')}:</span>
        <div className="flex items-center gap-1">
          {(
            [
              { code: 'en', label: 'EN' },
              { code: 'ta', label: 'தமிழ்' },
              { code: 'hi', label: 'हिन्दी' },
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
                    ? 'border border-[#4285F4] bg-white text-[#1967D2]'
                    : 'border border-transparent text-[#5F6368] hover:bg-white hover:text-[#202124]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Navigation List (40px tall, single line, no internal scroll at 768px height) */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
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
                  ? 'bg-[#E8F0FE] font-semibold text-[#1967D2]'
                  : 'font-normal text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]'
              }`}
            >
              <i
                className={`ti ${item.icon} text-lg shrink-0 ${
                  active ? 'text-[#4285F4]' : 'text-[#5F6368]'
                }`}
              />
              <span className="truncate leading-none">{label}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-[#E8F0FE] px-1.5 py-0.5 text-[10px] font-semibold text-[#1967D2]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Minimal Footer Info */}
      <div className="border-t border-[#E8EAED] px-4 py-2.5 text-[11px] text-[#5F6368]">
        <div className="flex items-center justify-between">
          <span>India Architecture</span>
          <span className="font-mono text-[10px] text-[#9AA0A6]">v0.1.0</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block lg:shrink-0">{content}</div>

      {/* Mobile Drawer (with Backdrop overlay, focus trap, Escape to close) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative z-10 flex h-full w-[256px] flex-col bg-white shadow-xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
