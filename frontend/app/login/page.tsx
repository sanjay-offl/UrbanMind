'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { DEMO_USERS } from '@/lib/constants';
import { toast } from '@/components/ui/toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [resolvedTheme, setResolvedTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('urbanmind-theme') || 'dark';
    setResolvedTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  function handleThemeToggle() {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setResolvedTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('urbanmind-theme', next);
  }

  function updateProgress(eVal = email, pVal = password) {
    let score = 0;
    if (eVal.trim().length > 0) score += 50;
    if (pVal.length > 0) score += 50;
    setFormProgress(score);
  }

  function fillCredentials(fillEmail: string, fillPass: string) {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError(false);
    updateProgress(fillEmail, fillPass);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      triggerError();
      return;
    }
    setLoading(true);
    setError(false);

    setTimeout(() => {
      const user = login(email, password);
      if (user) {
        toast.success(`Welcome back, ${user.name}`);
        router.replace('/dashboard');
      } else {
        setLoading(false);
        triggerError();
      }
    }, 600);
  }

  function triggerError() {
    setError(true);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Fixed theme toggle — top right of login screen */}
      <button
        type="button"
        onClick={handleThemeToggle}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 100,
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'var(--glass)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          boxShadow: '0 2px 12px rgba(154,23,80,0.15)',
          transition: 'all 200ms ease',
          animation: 'fadeIn 600ms ease 800ms both',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent-muted)';
          e.currentTarget.style.borderColor = 'var(--accent-border)';
          e.currentTarget.style.color = 'var(--rose)';
          e.currentTarget.style.transform = 'scale(1.08) rotate(15deg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--glass)';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
        }}
        title={
          resolvedTheme === 'dark'
            ? 'Switch to light mode'
            : 'Switch to dark mode'
        }
      >
        <i
          className={resolvedTheme === 'dark' ? 'ti ti-sun' : 'ti ti-moon'}
          style={{ fontSize: '18px' }}
        />
      </button>

      {/* Logo — animate in */}
      <div
        style={{
          animation: 'fadeUp 500ms cubic-bezier(0.4,0,0.2,1) both',
          marginBottom: '12px',
          textAlign: 'center',
        }}
      >
        <img
          src={
            resolvedTheme === 'light'
              ? '/logos/urbanmind_light_logo.png'
              : '/logos/urbanmind_dark_logo.png'
          }
          alt="UrbanMind"
          style={{
            height: '56px',
            width: 'auto',
            maxWidth: '200px',
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto',
          }}
        />
        {/* Accent underline below logo */}
        <div
          style={{
            width: '40px',
            height: '2px',
            background: 'linear-gradient(90deg, var(--crimson), var(--rose))',
            borderRadius: '2px',
            margin: '10px auto 0',
            animation: 'progressFill 600ms ease 300ms both',
          }}
        />
      </div>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '28px',
          textAlign: 'center',
          animation: 'fadeUp 500ms ease 150ms both',
          letterSpacing: '0.02em',
        }}
      >
        AI Intelligence Platform for City Governance
      </p>

      {/* Login card */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--glass)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--glass-border-top)',
          borderLeft: '1px solid var(--glass-border)',
          borderRight: '1px solid var(--glass-border)',
          borderBottom: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius)',
          padding: '36px',
          boxShadow: 'var(--card-shadow)',
          animation: 'cardEntrance 500ms cubic-bezier(0.4,0,0.2,1) 100ms both',
          position: 'relative',
          overflow: 'hidden',
        }}
        className={shakeError ? 'shake-anim' : ''}
      >
        {/* Decorative top-right corner glow */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(154,23,80,0.12), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Progress bar */}
        <div
          style={{
            height: '3px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '2px',
            marginBottom: '28px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${formProgress}%`,
              background: 'linear-gradient(90deg, var(--crimson), var(--rose))',
              borderRadius: '2px',
              transition: 'width 300ms ease',
            }}
          />
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 500,
            marginBottom: '4px',
            color: 'var(--text-primary)',
            animation: 'fadeUp 400ms ease 200ms both',
          }}
        >
          Sign in
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            marginBottom: '24px',
            animation: 'fadeUp 400ms ease 250ms both',
          }}
        >
          Enter your credentials to access the dashboard
        </p>

        {/* Error state */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(154,23,80,0.10)',
              border: '1px solid rgba(154,23,80,0.30)',
              color: '#EE4C7C',
              fontSize: '13px',
              marginBottom: '16px',
              animation: 'fadeIn 200ms ease both',
            }}
          >
            <i className="ti ti-alert-circle" style={{ fontSize: '16px' }} />
            Invalid credentials. Try a demo account below.
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email field */}
          <div
            style={{
              marginBottom: '14px',
              animation: 'fadeUp 400ms ease 300ms both',
            }}
          >
            <label
              className="data-label"
              style={{ display: 'block', marginBottom: '6px' }}
            >
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <i
                className="ti ti-mail"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '16px',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  updateProgress(e.target.value, password);
                }}
                placeholder="admin@urbanmind.gov.in"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  fontSize: '14px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--input-focus)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(154,23,80,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--input-border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div
            style={{
              marginBottom: '22px',
              animation: 'fadeUp 400ms ease 350ms both',
            }}
          >
            <label
              className="data-label"
              style={{ display: 'block', marginBottom: '6px' }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <i
                className="ti ti-lock"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '16px',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  updateProgress(email, e.target.value);
                }}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 38px',
                  fontSize: '14px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--input-focus)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(154,23,80,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--input-border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: 'var(--text-muted)',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = 'var(--rose)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'var(--text-muted)')
                }
              >
                <i
                  className={showPassword ? 'ti ti-eye-off' : 'ti ti-eye'}
                  style={{ fontSize: '16px' }}
                />
              </button>
            </div>
          </div>

          {/* Sign in button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading
                ? 'rgba(154,23,80,0.50)'
                : 'linear-gradient(135deg, #9A1750 0%, #EE4C7C 100%)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '14px',
              transition: 'all 200ms ease',
              letterSpacing: '0.01em',
              animation: 'fadeUp 400ms ease 400ms both',
              boxShadow: '0 4px 16px rgba(154,23,80,0.30)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background =
                  'linear-gradient(135deg, #7D1241 0%, #D43D6B 100%)';
                e.currentTarget.style.boxShadow =
                  '0 6px 24px rgba(154,23,80,0.45)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background =
                  'linear-gradient(135deg, #9A1750 0%, #EE4C7C 100%)';
                e.currentTarget.style.boxShadow =
                  '0 4px 16px rgba(154,23,80,0.30)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = 'translateY(1px)')
            }
            onMouseUp={(e) =>
              (e.currentTarget.style.transform = 'translateY(-1px)')
            }
          >
            {loading ? (
              <>
                <i
                  className="ti ti-loader-2"
                  style={{
                    fontSize: '18px',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Signing in...
              </>
            ) : (
              <>
                <i className="ti ti-login" style={{ fontSize: '18px' }} />
                Sign in
              </>
            )}
          </button>
        </form>

        {/* Forgot password */}
        <div
          style={{
            textAlign: 'right',
            marginBottom: '20px',
            animation: 'fadeUp 400ms ease 450ms both',
          }}
        >
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '13px',
              color: 'var(--rose)',
              cursor: 'pointer',
              padding: 0,
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'var(--crimson)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--rose)')}
          >
            Forgot password?
          </button>
        </div>

        {/* Demo credentials box */}
        <div
          style={{
            background: 'rgba(154,23,80,0.05)',
            border: '1px solid rgba(154,23,80,0.15)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            animation: 'fadeUp 400ms ease 500ms both',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '12px',
            }}
          >
            <i
              className="ti ti-key"
              style={{ fontSize: '14px', color: 'var(--rose)' }}
            />
            <span className="data-label" style={{ color: 'var(--rose)' }}>
              Demo Credentials
            </span>
          </div>

          {/* Role chips */}
          {DEMO_USERS.map((u, idx) => (
            <button
              key={u.email}
              type="button"
              onClick={() => fillCredentials(u.email, u.password)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${u.chipBorder}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                marginBottom: idx < DEMO_USERS.length - 1 ? '8px' : 0,
                transition: 'all 180ms ease',
                animation: `fadeUp 400ms ease ${550 + idx * 60}ms both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = u.chipHoverBg;
                e.currentTarget.style.borderColor = u.chipHoverBorder;
                e.currentTarget.style.transform = 'translateX(3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = u.chipBorder;
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              {/* Role badge */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '99px',
                  background: u.badgeBg,
                  color: u.badgeColor,
                  border: `1px solid ${u.badgeBorder}`,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  letterSpacing: '0.02em',
                }}
              >
                {u.badgeLabel}
              </span>

              {/* Email */}
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-data)',
                  color: 'var(--text-secondary)',
                  flex: 1,
                  textAlign: 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {u.email}
              </span>

              {/* Use button */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: u.badgeColor,
                  background: u.badgeBg,
                  border: `1px solid ${u.badgeBorder}`,
                  padding: '3px 10px',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              >
                Use
              </span>
            </button>
          ))}

          {/* Permissions summary per role */}
          <div
            style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(154,23,80,0.10)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: '6px',
            }}
          >
            {[
              { role: 'Admin', perms: 'Full access', color: '#EE4C7C' },
              { role: 'Ward', perms: 'Ward 42 + Upload', color: '#E3AFBC' },
              { role: 'Analyst', perms: 'Read only', color: '#E3E2DF' },
            ].map((r) => (
              <div
                key={r.role}
                style={{
                  textAlign: 'center',
                  padding: '6px 4px',
                  background: 'rgba(154,23,80,0.05)',
                  borderRadius: '6px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: r.color,
                    marginBottom: '2px',
                  }}
                >
                  {r.role}
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                  }}
                >
                  {r.perms}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p
        style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginTop: '24px',
          textAlign: 'center',
          animation: 'fadeUp 400ms ease 700ms both',
          letterSpacing: '0.03em',
        }}
      >
        Secured by AI · UN SDG 16 · Version 1.0
      </p>
    </div>
  );
}
