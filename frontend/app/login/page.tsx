'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { DEMO_CREDENTIALS, login } from '@/lib/auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from '@/components/ui/toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const user = login(email, password);
    if (user) {
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      router.replace('/dashboard');
    } else {
      setError('Invalid credentials. Use the demo credentials below.');
      setSubmitting(false);
    }
  }

  function fillDemo() {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError(null);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '20px',
      }}
    >
      <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
        <ThemeToggle />
      </div>

      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            id="logo-login"
            className="um-logo"
            src="/urbanmind_dark_logo.png"
            alt="UrbanMind"
            style={{ height: '56px', width: 'auto', margin: '0 auto 12px auto', objectFit: 'contain' }}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            AI Intelligence Platform for City Governance
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Sign in
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            Enter your credentials to access the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                placeholder="admin@urbanmind.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: 'var(--glass)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: '10px',
                  padding: '12px 16px 12px 40px',
                  width: '100%',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'var(--font-mono), monospace',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  background: 'var(--glass)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: '10px',
                  padding: '12px 40px 12px 40px',
                  width: '100%',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'var(--font-mono), monospace',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p
              style={{
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid var(--status-critical)',
                color: 'var(--status-critical)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-base)',
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '13px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div
          style={{
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <KeyRound size={14} />
            Demo credentials
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
            Email: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono), monospace' }}>{DEMO_CREDENTIALS.email}</span>
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
            Password: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono), monospace' }}>{DEMO_CREDENTIALS.password}</span>
          </p>
          <button
            type="button"
            onClick={fillDemo}
            style={{
              background: 'var(--glass-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '4px',
            }}
          >
            <Sparkles size={14} />
            Fill demo credentials
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ShieldCheck size={14} />
          Demo environment — credentials stored locally
        </p>
      </div>
    </div>
  );
}
