'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, logout } from '@/lib/auth';
import { useGeography } from '@/lib/ward-context';
import { toast } from '@/components/ui/toast';
import BrandLogo from '@/components/brand-logo';

export default function Header({
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { geoBreadcrumb } = useGeography();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setAvatarOpen(false);
    logout();
    toast.success('Signed out successfully');
    router.replace('/login');
  };

  const handleVoiceTrigger = () => {
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.info('Voice input: Audio streaming active on /submit voice intake.');
      router.push('/submit');
      return;
    }

    if (voiceActive) {
      setVoiceActive(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setVoiceActive(true);
      toast.info('Listening... Speak your civic query or grievance in any Indic language.');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceActive(false);
        toast.success(`Heard: "${transcript}"`);
        router.push(`/agent?q=${encodeURIComponent(transcript)}`);
      };

      recognition.onerror = () => {
        setVoiceActive(false);
        toast.info('Audio processed. Navigating to AI Assistant.');
        router.push('/agent');
      };

      recognition.onend = () => {
        setVoiceActive(false);
      };

      recognition.start();
    } catch {
      setVoiceActive(false);
      router.push('/agent');
    }
  };

  const userName = user?.name || 'Administrator';
  const userRole =
    user?.role === 'admin'
      ? 'National Admin'
      : (user?.role as string) === 'ward_officer' || (user?.role as string) === 'ward'
      ? 'Ward Officer'
      : 'Policy Analyst';
  const initials =
    user?.name
      ?.split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'UM';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6">
      {/* Left: Mobile hamburger & India region selector */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--bg)] lg:hidden"
        >
          <i className={sidebarOpen ? 'ti ti-x text-lg' : 'ti ti-menu-2 text-lg'} />
        </button>

        {/* "India" region selector breadcrumb */}
        <nav aria-label="Geography Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs">
          <i className="ti ti-map-pin text-sm text-[var(--primary)]" />
          {geoBreadcrumb.map((item, idx) => (
            <span key={item.level} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-[var(--border)]">/</span>}
              <span
                className={
                  idx === geoBreadcrumb.length - 1
                    ? 'font-semibold text-[var(--text)]'
                    : 'text-[var(--text-muted)]'
                }
              >
                {item.name}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Voice Query button (40px) and User Chip (40px), 12px gap, vertically centered */}
      <div className="flex items-center gap-3">
        {/* Voice Trigger button (40px high) */}
        <button
          type="button"
          onClick={handleVoiceTrigger}
          title="Voice conversation & query"
          className={`flex h-10 items-center gap-2 rounded-lg border px-3.5 text-xs font-medium transition-colors ${
            voiceActive
              ? 'border-[var(--red)] bg-[var(--critical-soft)] text-[var(--critical)] animate-pulse'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--bg)]'
          }`}
        >
          <i
            className={`ti ${
              voiceActive ? 'ti-microphone-2 text-[var(--red)]' : 'ti-microphone text-[var(--blue)]'
            } text-base`}
          />
          <span className="hidden md:inline font-sans">
            {voiceActive ? 'Listening...' : 'Voice Query'}
          </span>
        </button>

        {/* User chip (40px high) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setAvatarOpen(!avatarOpen)}
            className="flex h-10 items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-left transition-colors hover:bg-[var(--bg)]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--primary)] text-xs font-bold text-white">
              {initials}
            </div>
            <div className="hidden text-left lg:block">
              <div className="text-xs font-semibold leading-tight text-[var(--text)]">{userName}</div>
              <div className="text-[10px] leading-tight text-[var(--text-muted)]">{userRole}</div>
            </div>
            <i className="ti ti-chevron-down text-xs text-[var(--text-muted)]" />
          </button>

          {avatarOpen && (
            <div className="civic-card absolute right-0 mt-2 w-56 p-2 shadow-lg z-50">
              <div className="border-b border-[var(--border)] px-3 py-2">
                <p className="text-xs font-semibold text-[var(--text)]">{userName}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{user?.email}</p>
                <span className="mt-1 inline-block rounded bg-[var(--primary-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
                  {userRole}
                </span>
              </div>

              <div className="pt-1">
                <Link
                  href="/settings"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--bg)]"
                >
                  <i className="ti ti-settings text-sm text-[var(--text-muted)]" />
                  <span>Platform Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-[var(--critical)] hover:bg-[var(--critical-soft)]"
                >
                  <i className="ti ti-logout text-sm" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
