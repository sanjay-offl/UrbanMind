'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/toast';
import { useThemeController } from '@/components/theme-provider';

function UserMenuItem({
  item,
  onSelect,
}: {
  item: { label: string; icon?: string; href?: string; danger?: boolean };
  onSelect: () => void;
}) {
  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    color: item.danger ? '#EE4C7C' : 'var(--text-secondary)',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    textDecoration: 'none',
    transition: 'var(--transition)',
  };
  const content = (
    <>
      {item.icon && <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} />}
      {item.label}
    </>
  );
  return item.href ? (
    <Link href={item.href} style={style} onClick={onSelect}>
      {content}
    </Link>
  ) : (
    <button style={style} onClick={onSelect}>
      {content}
    </button>
  );
}

export default function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, applyTheme } = useThemeController();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const resolvedTheme = theme || 'dark';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSignOut() {
    setMenuOpen(false);
    setNotificationsOpen(false);
    toast.success('Signed out');
    router.replace('/login');
  }

  function handleThemeToggle() {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('urbanmind-theme', next);
  }

  function toggleSidebar() {
    setSidebarOpen((v) => !v);
  }

  const userName = user?.name || 'Admin User';
  const initials =
    user?.initials ||
    userName
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ||
    'AU';

  const userMenuItems = [
    { label: 'Profile & settings', icon: 'ti-user-circle', href: '/profile' },
    { label: 'Sign out', icon: 'ti-logout', danger: true },
  ];

  return (
    <header
      style={{
        height: '64px',
        minHeight: '64px',
        maxHeight: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
        background: 'var(--navbar-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'relative',
        zIndex: 50,
        overflow: 'visible',
      }}
    >
      {/* Left: mobile hamburger + logo */}
      <button
        className="md:hidden"
        onClick={toggleSidebar}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          padding: 8,
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="Toggle sidebar"
      >
        <i className="ti ti-menu-2" style={{ fontSize: 20 }} />
      </button>
      <img
        src={
          resolvedTheme === 'light'
            ? '/logos/urbanmind_light_logo.png'
            : '/logos/urbanmind_dark_logo.png'
        }
        alt="UrbanMind"
        style={{
          height: '28px',
          width: 'auto',
          maxWidth: '140px',
          objectFit: 'contain',
          flexShrink: 0,
        }}
        className="hidden md:block"
      />

      {/* Center: search */}
      <div
        style={{
          flex: 1,
          maxWidth: 400,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        <i
          className="ti ti-search"
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 16,
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          placeholder="Search grievances, wards, issues..."
          style={{
            width: '100%',
            background: 'var(--input-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 40px 10px 38px',
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
            transition: 'var(--transition)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent-border)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
        />
        <span
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11,
            fontFamily: 'var(--font-data)',
            color: 'var(--text-muted)',
            background: 'var(--glass)',
            padding: '2px 6px',
            borderRadius: 4,
            border: '1px solid var(--glass-border)',
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right cluster */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginLeft: 'auto',
        }}
      >
        {/* 1. Theme toggle button */}
        <button
          type="button"
          onClick={handleThemeToggle}
          title={
            resolvedTheme === 'dark'
              ? 'Switch to light mode'
              : 'Switch to dark mode'
          }
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--glass)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            flexShrink: 0,
            transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--rose)';
            e.currentTarget.style.borderColor = 'var(--accent-border)';
            e.currentTarget.style.background = 'var(--accent-muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.background = 'var(--glass)';
          }}
        >
          <i
            className={resolvedTheme === 'dark' ? 'ti ti-sun' : 'ti ti-moon'}
            style={{ fontSize: '18px' }}
          />
        </button>

        {/* 2. Divider line */}
        <div
          style={{
            width: 1,
            height: 20,
            background: 'var(--glass-border)',
          }}
        />

        {/* 3. Notification bell + Dropdown container */}
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((o) => !o)}
            style={{
              position: 'relative',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Notifications"
          >
            <i className="ti ti-bell" style={{ fontSize: 20 }} />
            <span
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--rose)',
                animation: 'pulseDot 1.5s ease-in-out infinite',
              }}
            />
          </button>

          {/* Notification dropdown */}
          {notificationsOpen && (
            <div
              style={{
                position: 'absolute',
                top: '56px',
                right: '0px',
                width: '320px',
                zIndex: 9999,
                background: 'var(--dropdown-bg)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 18px',
                  borderBottom: '1px solid var(--glass-border)',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                  }}
                >
                  Notifications
                </span>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  style={{
                    fontSize: '12px',
                    color: 'var(--rose)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Mark all read
                </button>
              </div>

              {/* Notification items */}
              {[
                {
                  color: '#EE4C7C',
                  bg: 'rgba(154,23,80,0.12)',
                  icon: 'ti-alert-triangle',
                  title: 'Ward 42 sewage escalated to Critical',
                  time: '5 min ago',
                },
                {
                  color: '#E3AFBC',
                  bg: 'rgba(154,23,80,0.12)',
                  icon: 'ti-file-analytics',
                  title: 'Monthly report ready to download',
                  time: '1 hour ago',
                },
                {
                  color: '#E3E2DF',
                  bg: 'rgba(154,23,80,0.12)',
                  icon: 'ti-robot',
                  title: 'AI flagged 12 new high-priority issues',
                  time: '3 hours ago',
                },
              ].map((n, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 18px',
                    borderBottom:
                      i < 2 ? '1px solid var(--glass-border)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      'rgba(255,255,255,0.04)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  {/* Icon circle */}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: n.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <i
                      className={`ti ${n.icon}`}
                      style={{ fontSize: '16px', color: n.color }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        lineHeight: 1.5,
                        marginBottom: '3px',
                      }}
                    >
                      {n.title}
                    </p>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-data)',
                      }}
                    >
                      {n.time}
                    </span>
                  </div>

                  {/* Unread dot */}
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: n.color,
                      flexShrink: 0,
                      marginTop: '4px',
                    }}
                  />
                </div>
              ))}

              {/* Footer */}
              <div
                style={{
                  padding: '12px 18px',
                  textAlign: 'center',
                  borderTop: '1px solid var(--glass-border)',
                }}
              >
                <button
                  type="button"
                  style={{
                    fontSize: '13px',
                    color: 'var(--rose)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Divider line */}
        <div
          style={{
            width: 1,
            height: 20,
            background: 'var(--glass-border)',
          }}
        />

        {/* 5. User avatar container + dropdown */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
            }}
            aria-label="Account menu"
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background:
                  user?.role === 'admin'
                    ? 'linear-gradient(135deg, #9A1750, #EE4C7C)'
                    : user?.role === 'ward_officer'
                    ? 'linear-gradient(135deg, #EE4C7C, #E3AFBC)'
                    : 'linear-gradient(135deg, #E3AFBC, #E3E2DF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: user?.role === 'analyst' ? '#0D0D0D' : '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {initials}
            </div>
            <span
              style={{
                fontSize: 14,
                color: 'var(--text-primary)',
                display: 'none',
              }}
              className="md:inline"
            >
              {userName}
            </span>
            <i
              className="ti ti-chevron-down"
              style={{ fontSize: 14, color: 'var(--text-muted)' }}
            />
          </button>

          {/* User dropdown */}
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '56px',
                right: '0',
                width: 180,
                zIndex: 9999,
                background: 'var(--dropdown-bg)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: 8,
                boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--glass-border)',
                }}
              >
                <p
                  style={{
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                  className="truncate"
                >
                  {userName}
                </p>
                <p
                  style={{ color: 'var(--text-muted)', fontSize: 11 }}
                  className="truncate"
                >
                  {user?.email ?? 'admin@urbanmind.gov.in'}
                </p>
              </div>
              <div style={{ paddingTop: 4 }}>
                {userMenuItems.map((item) =>
                  item.danger ? (
                    <UserMenuItem
                      key={item.label}
                      item={item}
                      onSelect={handleSignOut}
                    />
                  ) : (
                    <UserMenuItem
                      key={item.label}
                      item={item}
                      onSelect={() => setMenuOpen(false)}
                    />
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
