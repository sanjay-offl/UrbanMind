'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  MapPin,
  TrendingUp,
  Bot,
  FileText,
  Upload,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/grievances', label: 'Grievances', icon: Inbox },
  { href: '/map', label: 'Map', icon: MapPin },
  { href: '/trends', label: 'Trends', icon: TrendingUp },
  { href: '/agent', label: 'AI Agent', icon: Bot },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/upload', label: 'Upload', icon: Upload },
];

const FOOTER_ITEMS = [
  { href: '/profile', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
      className="flex w-60 min-w-60 max-w-60 flex-col overflow-hidden"
    >
      <div className="flex items-center gap-2 overflow-hidden px-4 pb-4 pt-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <img
          id="logo-sidebar"
          className="um-logo"
          src="/urbanmind_dark_logo.png"
          alt="UrbanMind"
          height={32}
          style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}`));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--glass-hover)' : 'transparent',
                borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                transition: 'all 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--glass-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 p-3" style={{ borderTop: '1px solid var(--border)' }}>
        {FOOTER_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--glass-hover)' : 'transparent',
                borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                transition: 'all 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--glass-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
