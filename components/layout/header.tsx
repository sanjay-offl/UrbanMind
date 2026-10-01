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
  const [transcribedText, setTranscribedText] = useState('');
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
    // Check for Web Speech Recognition API
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.info('Voice input: Audio streaming active on /submit voice intake.');
      router.push('/submit');
      return;
    }

    if (voiceActive) {
      setVoiceActive(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setVoiceActive(true);
      toast.info('Listening... Speak your civic query or grievance in any Indic language.');

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setVoiceActive(false);
        setTranscribedText(transcript);
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
  const userRole = user?.role === 'admin' ? 'National Admin' : user?.role === 'ward' ? 'Ward Officer' : 'Policy Analyst';
  const initials =
    user?.name
      ?.split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'UM';

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#E8EAED] bg-white px-4 sm:px-6">
      {/* Left: Mobile hamburger & brand on mobile only */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8EAED] bg-white text-[#5F6368] hover:bg-[#F8FAFC] lg:hidden"
        >
          <i className={sidebarOpen ? 'ti ti-x text-lg' : 'ti ti-menu-2 text-lg'} />
        </button>

        {/* Brand mark appears on mobile only in header (desktop has it in sidebar) */}
        <div className="lg:hidden">
          <BrandLogo size="sm" showText showTagline={false} />
        </div>
      </div>

      {/* Center: Geography breadcrumb bound to shared geography state */}
      <nav aria-label="Geography Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs">
        <i className="ti ti-map-pin text-sm text-[#4285F4]" />
        {geoBreadcrumb.map((item, idx) => (
          <span key={item.level} className="flex items-center gap-1.5">
            {idx > 0 && <span className="text-[#DADCE0]">/</span>}
            <span
              className={
                idx === geoBreadcrumb.length - 1
                  ? 'font-semibold text-[#202124]'
                  : 'text-[#5F6368]'
              }
            >
              {item.name}
            </span>
          </span>
        ))}
      </nav>

      {/* Right: Voice trigger and Avatar menu only */}
      <div className="flex items-center gap-3">
        {/* Voice Trigger button */}
        <button
          type="button"
          onClick={handleVoiceTrigger}
          title="Voice conversation & query"
          className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors ${
            voiceActive
              ? 'border-[#EA4335] bg-[#FCE8E6] text-[#C5221F] animate-pulse'
              : 'border-[#DADCE0] bg-white text-[#202124] hover:bg-[#F8FAFC]'
          }`}
        >
          <i className={`ti ${voiceActive ? 'ti-microphone-2 text-[#EA4335]' : 'ti-microphone text-[#4285F4]'} text-base`} />
          <span className="hidden md:inline">
            {voiceActive ? 'Listening...' : 'Voice Query'}
          </span>
        </button>

        {/* Avatar menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setAvatarOpen(!avatarOpen)}
            className="flex h-9 items-center gap-2 rounded-lg border border-[#E8EAED] bg-white p-1 pr-2.5 text-left transition-colors hover:bg-[#F8FAFC]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1A73E8] text-xs font-bold text-white">
              {initials}
            </div>
            <div className="hidden text-left lg:block">
              <div className="text-xs font-semibold leading-tight text-[#202124]">{userName}</div>
              <div className="text-[10px] leading-tight text-[#5F6368]">{userRole}</div>
            </div>
            <i className="ti ti-chevron-down text-xs text-[#9AA0A6]" />
          </button>

          {avatarOpen && (
            <div className="civic-panel absolute right-0 mt-2 w-56 p-1.5 shadow-md">
              <div className="border-b border-[#E8EAED] px-3 py-2">
                <p className="text-xs font-semibold text-[#202124]">{userName}</p>
                <p className="text-[11px] text-[#5F6368]">{user?.email}</p>
                <span className="mt-1 inline-block rounded bg-[#E8F0FE] px-1.5 py-0.5 text-[10px] font-semibold text-[#1967D2]">
                  {userRole}
                </span>
              </div>

              <div className="pt-1">
                <Link
                  href="/settings"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-[#202124] hover:bg-[#F8FAFC]"
                >
                  <i className="ti ti-settings text-sm text-[#5F6368]" />
                  <span>Platform Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-[#EA4335] hover:bg-[#FCE8E6]"
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
