'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { DEMO_CREDENTIALS, login } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
      className="min-h-screen flex items-center justify-center relative p-4 transition-colors"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <img
            id="logo-login"
            className="um-logo mx-auto h-14 w-auto"
            src="/urbanmind_dark_logo.png"
            alt="UrbanMind"
          />
          <p className="text-label tracking-widest text-center" style={{ color: 'var(--text-muted)' }}>
            AI-powered citizen grievance intelligence
          </p>
        </div>

        <div className="glass-card w-full p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-h2" style={{ color: 'var(--text-primary)' }}>Sign in</h1>
            <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>
              Enter your credentials to access the dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@urbanmind.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-body font-mono outline-none transition-all"
                  style={{
                    background: 'var(--glass)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-body font-mono outline-none transition-all"
                  style={{
                    background: 'var(--glass)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p
                className="rounded-lg p-3 text-xs font-medium"
                style={{
                  background: 'rgba(255, 68, 68, 0.1)',
                  border: '1px solid var(--status-critical)',
                  color: 'var(--status-critical)',
                }}
              >
                {error}
              </p>
            )}

            <button type="submit" className="btn-accent w-full py-3" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}
          >
            <div className="flex items-center gap-2 text-label">
              <KeyRound className="h-3.5 w-3.5" />
              Demo credentials
            </div>
            <div className="space-y-1 text-caption">
              <p>
                Email: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{DEMO_CREDENTIALS.email}</span>
              </p>
              <p>
                Password: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{DEMO_CREDENTIALS.password}</span>
              </p>
            </div>
            <button
              type="button"
              className="mt-2 w-full py-2 px-3 rounded-lg text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              style={{
                background: 'var(--glass-hover)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onClick={fillDemo}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Fill demo credentials
            </button>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-caption" style={{ color: 'var(--text-muted)' }}>
          <ShieldCheck className="h-3.5 w-3.5" />
          Demo environment — credentials are stored locally in your browser
        </p>
      </div>
    </div>
  );
}
