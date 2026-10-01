'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, KeyRound, Check, MapPin } from 'lucide-react';
import { getSession, login } from '@/lib/auth';
import { DEMO_USERS } from '@/lib/constants';
import { toast } from '@/components/ui/toast';
import BrandLogo from '@/components/brand-logo';

const TEAM = ['Sanjay S', 'Gowsik', 'Dhanu Shree'] as const;
const REMEMBER_EMAIL_KEY = 'urbanmind-remembered-email';

const STORY_STEPS = [
  {
    step: '01',
    title: 'Multilingual Citizen Intake',
    desc: 'Voice, Web Portal, WhatsApp & CSV in 17 Indic language variants.',
  },
  {
    step: '02',
    title: 'Automated PII Redaction',
    desc: 'Aadhaar, Phone, and Email stripped before analysis.',
  },
  {
    step: '03',
    title: 'Public Infrastructure Context',
    desc: 'Cross-referenced against JJM, PMGSY, Swachh Bharat & Census data.',
  },
  {
    step: '04',
    title: 'Deterministic Urgency Scoring',
    desc: 'Auditable 0–100 mathematical priority engine with zero LLM hallucinations.',
  },
];

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
    try {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRemember(true);
      }
    } catch {
      // storage unavailable
    }
  }, []);

  // Redirect if already signed in
  useEffect(() => {
    if (getSession()) {
      router.replace('/dashboard');
    }
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
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);

      try {
        if (remember) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        // ignore
      }

      toast.success(`Welcome back, ${user.name}`);
      router.replace('/dashboard');
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Invalid credentials. Select a demo card below to autofill.'
      );
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white">
      {/* ─────────────── LEFT BRANDING PANEL (50% on desktop) ─────────────── */}
      <aside className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-[#E8EAED] bg-[#F8FAFC] p-8 xl:p-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3.5 py-1 text-xs font-semibold text-[var(--primary)] border border-[var(--primary-soft)]">
            <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
            <span>National Civic Intelligence Platform</span>
          </div>

          <div className="pt-4">
            <h2 className="text-2xl font-bold tracking-tight text-[#202124]">
              From Citizen Voice to National Priorities
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5F6368]">
              A unified civic intelligence workspace turning citizen complaints and public infrastructure metrics into auditable, objective action for officers.
            </p>
          </div>

          {/* India Dot Matrix / Geometric Representation */}
          <div className="rounded-xl border border-[#E8EAED] bg-white p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EAED]">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#4285F4]" />
                <span className="text-xs font-semibold text-[#202124]">National Geographic Scope</span>
              </div>
              <span className="rounded bg-[#E8F0FE] px-2 py-0.5 text-[10px] font-semibold text-[#1967D2]">
                36 States & UTs
              </span>
            </div>

            {/* Illustrative Dots Graphic */}
            <div className="my-4 flex items-center justify-center py-4">
              <svg width="220" height="120" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                {/* Simplified cluster of grid dots representing national data nodes */}
                {[
                  [30, 20, '#4285F4'], [55, 15, '#EA4335'], [80, 25, '#FBBC05'], [110, 15, '#34A853'], [140, 25, '#4285F4'], [170, 20, '#EA4335'],
                  [20, 50, '#34A853'], [50, 45, '#4285F4'], [80, 55, '#EA4335'], [110, 45, '#FBBC05'], [140, 50, '#34A853'], [170, 55, '#4285F4'], [195, 45, '#FBBC05'],
                  [40, 80, '#FBBC05'], [70, 85, '#34A853'], [100, 75, '#4285F4'], [130, 85, '#EA4335'], [160, 80, '#FBBC05'],
                  [90, 105, '#4285F4'], [110, 105, '#34A853'], [120, 100, '#EA4335']
                ].map(([cx, cy, fill], i) => (
                  <circle key={i} cx={cx as number} cy={cy as number} r="4" fill={fill as string} opacity="0.85" />
                ))}
              </svg>
            </div>
            <p className="text-center text-[11px] font-medium text-[#5F6368]">
              Illustrative visual, not live data
            </p>
          </div>

          {/* 4 Small Story Steps */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {STORY_STEPS.map((step) => (
              <div key={step.step} className="rounded-lg border border-[#E8EAED] bg-white p-3">
                <span className="font-mono text-[10px] font-bold text-[#1A73E8]">{step.step}</span>
                <h4 className="mt-1 text-xs font-semibold text-[#202124]">{step.title}</h4>
                <p className="mt-1 text-[11px] text-[#5F6368] leading-tight">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E8EAED] text-xs text-[#5F6368]">
          UrbanMind Civic Intelligence Engine · Open Government Architecture
        </div>
      </aside>

      {/* ─────────────── RIGHT AUTHENTICATION PANEL ─────────────── */}
      <main className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md space-y-6">
          {/* Brand logo once per screen above the form */}
          <div className="pb-1">
            <BrandLogo size="md" showText showTagline />
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1A73E8]">
              Citizen Complaint Intelligence
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#202124]">
              Welcome back
            </h1>
            <p className="mt-1 text-xs text-[#5F6368]">
              Sign in to continue to UrbanMind.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-[#FAD2CF] bg-[#FCE8E6] p-3 text-xs font-medium text-[#C5221F]">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field with boxed styling */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]" htmlFor="login-email">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                onBlur={() => setTouched(true)}
                placeholder="officer@urbanmind.gov.in"
                className={`w-full ${emailInvalid ? 'border-[#EA4335]' : ''}`}
                autoComplete="email"
                required
              />
              {emailInvalid && (
                <p className="text-[11px] text-[#EA4335]">Enter a valid email address.</p>
              )}
            </div>

            {/* Password Field with boxed styling & show toggle */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••••••"
                  className="w-full pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#202124]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#5F6368]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-[#DADCE0] text-[#1A73E8]"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo Access: 3 Compact Cards in 1 Row */}
          <section className="space-y-2.5 pt-2 border-t border-[#E8EAED]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#202124]">
              <KeyRound size={14} className="text-[#4285F4]" />
              <span>Demo access (fills fields only)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => fillCredentials(u.email, u.password)}
                  title={`${u.email} — Click to autofill credentials`}
                  className="flex flex-col text-left rounded-lg border border-[#E8EAED] bg-[#F8FAFC] p-2.5 transition-colors hover:border-[#1A73E8] hover:bg-[#E8F0FE]/30"
                >
                  <span className="text-[11px] font-bold text-[#1A73E8] truncate">
                    {u.badgeLabel}
                  </span>
                  <span className="text-xs font-medium text-[#202124] truncate">
                    {u.name}
                  </span>
                  <span className="mt-1 text-[10px] text-[#5F6368] truncate" title={u.email}>
                    {u.role === 'admin' ? 'All India · Full' : u.role === 'ward_officer' ? 'Chennai Ward 1' : 'All India · Reports'}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Team Attribution Footer */}
          <footer className="pt-4 border-t border-[#E8EAED] text-center text-xs text-[#5F6368]">
            <span>Built by </span>
            <span className="font-medium text-[#202124]">{TEAM[0]}</span>
            <span className="mx-1.5">·</span>
            <span className="font-medium text-[#202124]">{TEAM[1]}</span>
            <span className="mx-1.5">·</span>
            <span className="font-medium text-[#202124]">{TEAM[2]}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
