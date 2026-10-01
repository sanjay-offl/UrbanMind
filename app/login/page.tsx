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
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

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
    setSelectedDemo(fillEmail);
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
    <div className="login-screen min-h-screen w-full overflow-x-hidden bg-slate-50 lg:flex lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <aside className="login-left-panel relative flex w-full flex-col justify-center border-b border-slate-200 px-6 py-7 sm:px-8 lg:h-screen lg:w-1/2 lg:overflow-hidden lg:border-b-0 lg:border-r lg:px-10 lg:py-4 xl:px-12 xl:py-5">
        <div className="flex flex-1 items-center justify-center lg:min-h-0">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 xl:gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              <span>National Civic Intelligence Platform</span>
            </div>

            <div className="login-rise login-delay-1 space-y-2">
              <h2 className="text-4xl font-bold leading-[1.08] tracking-tight text-slate-950 xl:text-5xl">
                From Citizen Voice to{' '}
                <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  National Priorities
                </span>
              </h2>
              <p className="line-clamp-2 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                A unified civic intelligence workspace turning citizen complaints and public infrastructure metrics into auditable, objective action for officers.
              </p>
            </div>

            <div className="login-rise login-delay-2 login-stage relative isolate hidden h-[220px] w-full overflow-hidden rounded-3xl border border-blue-100/80 shadow-sm sm:block lg:h-[260px] xl:h-[clamp(260px,38vh,420px)]">
              <div className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-md sm:left-4 sm:top-4">
                <MapPin size={14} className="shrink-0 text-blue-600" />
                <span>National Geographic Scope</span>
              </div>
              <span className="absolute right-3 top-3 z-20 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-blue-800 shadow-sm backdrop-blur-md sm:right-4 sm:top-4">
                36 States &amp; UTs
              </span>
              <div className="absolute inset-0 z-10 overflow-hidden rounded-3xl">
                <iframe
                  src="https://lottie.host/embed/7b11fe1b-3874-41f5-852e-4194f0c535f9/P7974HF9VG.lottie"
                  title="Citizen login illustration"
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 0,
                    background: 'transparent',
                    mixBlendMode: 'multiply',
                    transform: 'scale(1.5)',
                    transformOrigin: 'center',
                  }}
                  className="pointer-events-none"
                />
              </div>
            </div>

            <div className="login-rise login-delay-3 hidden auto-rows-fr grid-cols-2 gap-x-4 gap-y-3 lg:grid xl:grid-cols-4">
              {STORY_STEPS.map((step) => (
                <div key={step.step} className="flex min-h-[92px] flex-col border-t-2 border-blue-600/80 pt-2">
                  <span className="font-mono text-[10px] font-bold text-blue-700">{step.step}</span>
                  <h4 className="mt-1 text-sm font-bold leading-tight text-slate-900">{step.title}</h4>
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-3 text-xs text-slate-500 lg:mt-0">
          UrbanMind Civic Intelligence Engine · Open Government Architecture
        </div>
      </aside>

      <main className="login-right-panel flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:h-screen lg:w-1/2 lg:overflow-y-auto lg:px-10 lg:py-5 xl:px-12">
        <div className="login-form-enter mx-auto w-full max-w-md space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-blue-900/5 lg:p-10">
          <div className="pb-1">
            <BrandLogo size="md" showText showTagline />
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              Citizen Complaint Intelligence
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Welcome back
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Sign in to continue to UrbanMind.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600" htmlFor="login-email">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedDemo(null);
                  if (error) setError('');
                }}
                onBlur={() => setTouched(true)}
                placeholder="officer@urbanmind.gov.in"
                className={`login-input h-12 w-full rounded-xl border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 ${emailInvalid ? '!border-red-500 focus:!border-red-500 focus:!ring-red-500/30' : ''}`}
                autoComplete="email"
                required
              />
              {emailInvalid && (
                <p className="text-[11px] text-red-600">Enter a valid email address.</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSelectedDemo(null);
                    if (error) setError('');
                  }}
                  placeholder="••••••••••••"
                  className="login-input h-12 w-full rounded-xl border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5 text-xs">
              <label className="flex cursor-pointer select-none items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              {loading && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <section className="space-y-2 border-t border-slate-200 pt-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <KeyRound size={14} className="text-blue-600" />
              <span>Demo access (fills fields only)</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => fillCredentials(u.email, u.password)}
                  title={`${u.email} — Click to autofill credentials`}
                  className={`flex min-h-[76px] flex-col justify-center rounded-xl border p-2.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${selectedDemo === u.email ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20' : 'border-slate-200 bg-slate-50 hover:bg-white'}`}
                >
                  <span className="truncate text-[11px] font-bold text-blue-700">
                    {u.badgeLabel}
                  </span>
                  <span className="truncate text-xs font-bold text-slate-900">
                    {u.name}
                  </span>
                  <span className="mt-1 truncate text-[10px] text-slate-500" title={u.email}>
                    {u.role === 'admin' ? 'All India · Full' : u.role === 'ward_officer' ? 'Chennai Ward 1' : 'All India · Reports'}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <footer className="border-t border-slate-200 pt-3 text-center text-xs text-slate-500">
            <span>Built by </span>
            <span className="font-medium text-slate-900">{TEAM[0]}</span>
            <span className="mx-1.5">·</span>
            <span className="font-medium text-slate-900">{TEAM[1]}</span>
            <span className="mx-1.5">·</span>
            <span className="font-medium text-slate-900">{TEAM[2]}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
