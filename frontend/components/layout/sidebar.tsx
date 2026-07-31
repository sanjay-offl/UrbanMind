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
    <aside className="flex w-60 min-w-60 max-w-60 flex-col overflow-hidden border-r bg-card">
      <div className="flex items-center gap-2 overflow-hidden border-b px-4 pb-4 pt-5">
        <img
          id="logo-sidebar"
          className="um-logo"
          src="/urbanmind_dark_logo.png"
          alt="UrbanMind"
          height={32}
        />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t p-3">
        {FOOTER_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
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
