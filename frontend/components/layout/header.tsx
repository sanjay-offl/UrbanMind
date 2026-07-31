'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Search, UserRound } from 'lucide-react';
import { getSession, logout, type User } from '@/lib/auth';
import { useWard } from '@/lib/ward-context';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from '@/components/ui/toast';

const WARDS = ['all', 'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5'];

export default function Header() {
  const router = useRouter();
  const { selectedWard, setSelectedWard } = useWard();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('Admin User');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getSession());
    const storedName = localStorage.getItem('user_name');
    if (storedName) setUserName(storedName);
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

  const initials = userName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AU';

  return (
    <header
      style={{
        background: 'var(--glass)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
      className="flex h-16 shrink-0 items-center justify-between gap-4 px-6"
    >
      <div className="flex w-full max-w-md items-center gap-3">
        <img
          id="logo-navbar"
          className="um-logo hidden shrink-0 sm:block"
          src="/urbanmind_dark_logo.png"
          alt="UrbanMind"
          height={28}
          style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
        />
        <div className="relative w-full">
          <Search style={{ color: 'var(--text-muted)' }} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search grievances…"
            style={{
              background: 'var(--glass)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              borderRadius: 8,
              padding: '6px 12px 6px 36px',
              fontSize: 13,
              width: '100%',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Ward Dropdown */}
        <select
          value={selectedWard}
          onChange={(e) => setSelectedWard(e.target.value)}
          style={{
            background: 'var(--glass)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 13,
            cursor: 'pointer',
            backdropFilter: 'blur(var(--glass-blur))',
            outline: 'none',
          }}
        >
          {WARDS.map((w) => (
            <option key={w} value={w} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
              {w === 'all' ? 'All Wards' : w}
            </option>
          ))}
        </select>

        <ThemeToggle />

        <button
          type="button"
          style={{
            background: 'var(--glass)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            borderRadius: 8,
            padding: '8px',
            cursor: 'pointer',
            position: 'relative',
          }}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full p-1 transition-all"
            style={{ cursor: 'pointer' }}
            aria-label="Account menu"
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--accent)',
                color: 'var(--bg-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {initials}
            </span>
            <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                zIndex: 50,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                boxShadow: 'var(--shadow-md)',
                minWidth: 200,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }} className="truncate">
                  {userName}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 12 }} className="truncate">
                  {user?.email ?? 'admin@urbanmind.io'}
                </p>
              </div>

              <div style={{ padding: '4px 0' }}>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    color: 'var(--text-primary)',
                    padding: '10px 16px',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <UserRound className="h-4 w-4" />
                  Profile & settings
                </Link>

                <div style={{ borderColor: 'var(--border)', margin: '4px 0', borderTop: '1px solid var(--border)' }} />

                <div
                  onClick={handleSignOut}
                  style={{
                    color: 'var(--status-critical)',
                    padding: '10px 16px',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
