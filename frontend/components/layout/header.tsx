'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Search, UserRound } from 'lucide-react';
import { getSession, logout, type User } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from '@/components/ui/toast';

const WARDS = [
  { id: 1, name: 'Ward 1' },
  { id: 2, name: 'Ward 2' },
  { id: 3, name: 'Ward 3' },
];

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getSession());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSignOut() {
    logout();
    setMenuOpen(false);
    toast.success('Signed out');
    router.replace('/login');
  }

  const initials = (user?.name ?? 'SU')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex h-16 min-h-16 max-h-16 shrink-0 items-center justify-between gap-4 overflow-hidden border-b bg-card px-6">
      <div className="flex w-full max-w-md items-center gap-3">
        <img
          id="logo-navbar"
          className="um-logo hidden shrink-0 sm:block"
          src="/urbanmind_dark_logo.png"
          alt="UrbanMind"
          height={28}
        />
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search grievances…" className="pl-9" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Select value="all" onValueChange={() => undefined}>
          <SelectValue>All Wards</SelectValue>
          <SelectItem value="all">All Wards</SelectItem>
          {WARDS.map((ward) => (
            <SelectItem key={ward.id} value={String(ward.id)}>
              {ward.name}
            </SelectItem>
          ))}
        </Select>
        <ThemeToggle />
        <button className="relative rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full p-1 hover:bg-accent"
            aria-label="Account menu"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
              <div className="border-b px-4 py-3">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <div className="p-1">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <UserRound className="h-4 w-4" />
                  Profile & settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
