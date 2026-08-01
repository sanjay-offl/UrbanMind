'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, logout } from '@/lib/auth';
import { toast } from '@/components/ui/toast';
import { useThemeController } from '@/components/theme-provider';

const navItems = [
  {
    href: '/dashboard',
    icon: 'ti-layout-dashboard',
    label: 'Dashboard',
    permission: 'view_dashboard',
  },
  {
    href: '/grievances',
    icon: 'ti-message-report',
    label: 'Grievances',
    permission: 'view_grievances',
    badge: '187',
    badgeType: 'count',
  },
  {
    href: '/upload',
    icon: 'ti-upload',
    label: 'Upload',
    permission: 'upload_complaints',
  },
  {
    href: '/map',
    icon: 'ti-map-2',
    label: 'Ward Map',
    permission: 'view_map',
  },
  {
    href: '/trends',
    icon: 'ti-chart-line',
    label: 'Trends',
    permission: 'view_trends',
  },
  {
    href: '/agent',
    icon: 'ti-robot',
    label: 'AI Assistant',
    permission: 'use_agent',
  },
  {
    href: '/reports',
    icon: 'ti-file-analytics',
    label: 'Reports',
    permission: 'view_reports',
    badge: 'NEW',
    badgeType: 'new',
  },
  {
    href: '/profile',
    icon: 'ti-settings',
    label: 'Settings',
    permission: 'access_settings',
  },
];

function NavItem({
  item,
  pathname,
}: {
  item: (typeof navItems)[number];
  pathname: string;
}) {
  const active =
    pathname === item.href ||
    (item.href !== '/dashboard' && pathname.startsWith(`${item.href}`));

  const badgeStyle =
    item.badgeType === 'count'
      ? {
          background: 'rgba(238,76,124,0.15)',
          color: '#EE4C7C',
          border: '1px solid rgba(238,76,124,0.30)',
        }
      : {
          background: 'rgba(154,23,80,0.15)',
          color: '#E3AFBC',
          border: '1px solid rgba(154,23,80,0.30)',
        };

  return (
    <Link
      href={item.href}
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        transition: 'var(--transition)',
        position: 'relative',
        marginBottom: 2,
        textDecoration: 'none',
        borderLeft: active ? '3px solid #9A1750' : '3px solid transparent',
        paddingLeft: active ? 9 : 12,
        background: active ? 'rgba(154,23,80,0.10)' : 'transparent',
        color: active ? '#EE4C7C' : 'var(--text-secondary)',
        alignItems: 'center',
        fontSize: 14,
        fontWeight: active ? 500 : 400,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(154,23,80,0.06)';
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
      <i
        className={`ti ${item.icon}`}
        style={{ fontSize: 17, color: active ? '#EE4C7C' : 'inherit' }}
      />
      {item.label}
      {item.badge && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            padding: '2px 7px',
            borderRadius: 99,
            marginLeft: 'auto',
            whiteSpace: 'nowrap',
            ...badgeStyle,
          }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, can } = useAuth();
  const { theme } = useThemeController();

  const visibleItems = navItems.filter((item) => can(item.permission));

  const userName = user?.name || 'Admin User';
  const userInitials =
    user?.initials ||
    userName
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ||
    'AU';

  function handleLogout() {
    logout();
    toast.success('Signed out');
    router.replace('/login');
  }

  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        maxWidth: '240px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--sidebar-bg)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(154,23,80,0.10)',
        position: 'relative',
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      {/* TOP — Logo */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src={
              theme === 'light'
                ? '/logos/urbanmind_light_logo.png'
                : '/logos/urbanmind_dark_logo.png'
            }
            alt="UrbanMind"
            style={{
              height: '32px',
              width: 'auto',
              maxWidth: '160px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '9px',
              fontWeight: 500,
              padding: '2px 7px',
              background: 'rgba(154,23,80,0.10)',
              color: 'var(--rose)',
              borderRadius: '99px',
              border: '1px solid rgba(154,23,80,0.20)',
              marginLeft: 'auto',
              flexShrink: 0,
            }}
          >
            v1.0
          </span>
        </div>
      </div>

      {/* NAV ITEMS — Filtered by permissions */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {visibleItems.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {/* BOTTOM — User mini profile + logout */}
      <div style={{ padding: 16, borderTop: '1px solid var(--glass-border)' }}>
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            padding: '10px 12px',
            marginBottom: '8px',
            background: 'rgba(154,23,80,0.06)',
            border: '1px solid rgba(154,23,80,0.12)',
            borderRadius: 'var(--radius-sm)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: '36px',
              height: '36px',
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
              flexShrink: 0,
            }}
          >
            {userInitials}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userName}
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 500,
                marginTop: '2px',
                color:
                  user?.role === 'admin'
                    ? '#EE4C7C'
                    : user?.role === 'ward_officer'
                    ? '#E3AFBC'
                    : '#E3E2DF',
              }}
            >
              {user?.role === 'admin'
                ? '● Admin Officer'
                : user?.role === 'ward_officer'
                ? '● Ward Officer'
                : '● Analyst'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 14,
            transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(154,23,80,0.12)';
            e.currentTarget.style.borderColor = 'rgba(154,23,80,0.30)';
            e.currentTarget.style.color = '#EE4C7C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <i className="ti ti-logout" style={{ fontSize: 16 }} />
          Sign out
        </button>

        <p
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 12,
          }}
        >
          UN SDG 16 · Secured
        </p>
      </div>
    </aside>
  );
}
