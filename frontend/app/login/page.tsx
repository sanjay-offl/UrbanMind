'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, Eye, EyeOff, KeyRound } from 'lucide-react';
import { getSession, login } from '@/lib/auth';
import { DEMO_USERS } from '@/lib/constants';
import { toast } from '@/components/ui/toast';

const TEAM = ['Sanjay S', 'Gowsik', 'Dhanu Shree'] as const;
const REMEMBER_EMAIL_KEY = 'urbanmind-remembered-email';

/** Demo card metadata — presentation only; credentials come from constants. */
const DEMO_META: Record<
  string,
  { slot: 'admin' | 'ward' | 'analyst'; role: string; scope: string }
> = {
  'admin@urbanmind.gov.in': {
    slot: 'admin',
    role: 'National Admin',
    scope: 'All India · full access',
  },
  'ward@urbanmind.gov.in': {
    slot: 'ward',
    role: 'Ward Officer',
    scope: 'Chennai Ward 1 · action rights',
  },
  'analyst@urbanmind.gov.in': {
    slot: 'analyst',
    role: 'Policy Analyst',
    scope: 'All India · read + reports',
  },
};

function Character({
  variant,
  label,
}: {
  variant: 'blue' | 'green' | 'yellow' | 'red';
  label: string;
}) {
  return (
    <div
      className={`char char-${variant}`}
      role="img"
      aria-label={label}
    >
      <div className="char-face" aria-hidden="true">
        <div className="char-eyes">
          <span className="char-eye" />
          <span className="char-eye" />
        </div>
        <div className="char-mouth" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    // The login screen is always light: scope the light tokens to <body> so
    // the page chrome and toasts match, whatever the stored app theme is.
    document.body.classList.add('auth-light');
    try {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRemember(true);
      }
    } catch {
      /* storage unavailable — non-fatal */
    }
    return () => {
      document.body.classList.remove('auth-light');
    };
  }, []);

  // An already-signed-in officer never sees the sign-in form again.
  useEffect(() => {
    if (getSession()) router.replace('/dashboard');
  }, [router]);

  const emailInvalid =
    touched && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function fillCredentials(fillEmail: string, fillPass: string) {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError('');
    setTouched(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);

    if (!email.trim() || !password) {
      setError('Enter both your email and password to continue.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address, for example you@example.com.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);

      // "Remember me" persists the email for the next visit.
      try {
        if (remember) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        /* storage unavailable — non-fatal */
      }

      toast.success(`Welcome back, ${user.name}`);
      router.replace('/dashboard');
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Those credentials did not match. Use a demo account below.'
      );
    }
  }

  return (
    <div className="auth-shell auth-light">
      {/* ─────────────── BRANDING / ART ─────────────── */}
      <aside className="branding-panel" aria-label="UrbanMind branding">
        <div className="branding-content">
          <div className="branding-eyebrow">
            <span className="branding-dots" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            Live civic intelligence
          </div>

          <div className="char-stage" aria-hidden="false">
            <Character variant="blue" label="Blue geometric character" />
            <Character variant="green" label="Green geometric character" />
            <Character variant="yellow" label="Yellow geometric character" />
            <Character variant="red" label="Red geometric character" />
          </div>

          <div>
            <h2 className="branding-title">
              Every complaint,
              <br />
              understood.
            </h2>
            <p className="branding-sub">
              One calm workspace for citizens, ward officers and analysts to
              track, classify and resolve city grievances.
            </p>
          </div>
        </div>
      </aside>

      {/* ─────────────── AUTHENTICATION ─────────────── */}
      <main className="auth-panel">
        <div className="auth-form">
          {/* Brand identity */}
          <header className="auth-anim">
            <div className="wordmark">
              <span className="wordmark-bars" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className="wordmark-text">UrbanMind</span>
            </div>
            <p className="wordmark-sub">Citizen Complaint Intelligence</p>
          </header>

          <h1 className="auth-heading auth-anim">Welcome back</h1>
          <p className="auth-subheading auth-anim">
            Sign in to continue to UrbanMind.
          </p>

          <form onSubmit={handleLogin} noValidate>
            {error && (
              <div className="auth-alert" role="alert">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div
              className={`auth-field auth-anim${emailInvalid ? ' has-error' : ''}`}
            >
              <label className="auth-label" htmlFor="email">
                Email
              </label>
              <div className="auth-underline">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  onBlur={() => setTouched(true)}
                  aria-invalid={emailInvalid || undefined}
                  aria-describedby={emailInvalid ? 'email-error' : undefined}
                />
              </div>
              {emailInvalid && (
                <p className="auth-error-text" id="email-error">
                  Enter a valid email address.
                </p>
              )}
            </div>

            {/* Password */}
            <div className="auth-field auth-anim">
              <label className="auth-label" htmlFor="password">
                Password
              </label>
              <div className="auth-underline">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="auth-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="auth-row auth-anim">
              <label className="auth-check" htmlFor="remember">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="auth-check-box" aria-hidden="true">
                  <Check size={13} strokeWidth={3.5} />
                </span>
                <span className="auth-check-label">Remember me</span>
              </label>
              <button
                type="button"
                className="auth-link"
                onClick={() =>
                  toast.success('Password reset is not enabled in this demo.')
                }
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="auth-submit auth-anim"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo access */}
          <section className="auth-demo auth-anim" aria-labelledby="demo-heading">
            <div className="auth-demo-head" id="demo-heading">
              <KeyRound size={14} aria-hidden="true" />
              Demo access
            </div>
            <p className="auth-demo-note">
              Selecting a card fills the form only — you still press
              &ldquo;Sign&nbsp;in&rdquo;.
            </p>
            <div className="demo-grid">
              {DEMO_USERS.map((u) => {
                const meta = DEMO_META[u.email];
                return (
                  <button
                    key={u.email}
                    type="button"
                    data-role={meta?.slot}
                    className="demo-card"
                    onClick={() => fillCredentials(u.email, u.password)}
                    aria-label={`Fill the ${meta?.role ?? u.badgeLabel} demo credentials`}
                  >
                    <span className="demo-role">
                      <span className="dot" />
                      {meta?.role ?? u.badgeLabel}
                    </span>
                    <span className="demo-email">{u.email}</span>
                    <span className="demo-scope">{meta?.scope}</span>
                    <span className="demo-hint">Fill form →</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Secondary action */}
          <div className="auth-signup auth-anim">
            <span>Don&rsquo;t have an account?</span>
            <button
              type="button"
              className="auth-signup-link"
              onClick={() =>
                toast.success('Sign up is not enabled in this demo.')
              }
            >
              Sign up
            </button>
          </div>

          {/* Team attribution */}
          <footer className="auth-footer auth-anim">
            <span>Built by</span>
            <span className="names">{TEAM[0]}</span>
            <span className="sep" aria-hidden="true">
              ·
            </span>
            <span className="names">{TEAM[1]}</span>
            <span className="sep" aria-hidden="true">
              ·
            </span>
            <span className="names">{TEAM[2]}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
