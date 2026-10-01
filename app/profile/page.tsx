'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, UserRound, KeyRound, Palette } from 'lucide-react';
import { getSession, logout } from '@/lib/auth';
import PageHeader from '@/components/layout/page-header';
import { toast } from '@/components/ui/toast';
import { useThemeController } from '@/components/theme-provider';

export default function ProfilePage() {
  const router = useRouter();
  const { theme: currentTheme, applyTheme } = useThemeController();
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState('Admin User');
  const [saved, setSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setMounted(true);
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      setName(storedName);
    } else {
      const session = getSession();
      if (session?.name) setName(session.name);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user_name', name);
    setSaved(true);
    toast.success('Profile updated');
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter current password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    toast.success('Password changed successfully (stored locally)');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSignOut = () => {
    logout();
    toast.success('Signed out');
    router.replace('/login');
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', padding: '24px' }} className="space-y-6">
      <PageHeader
        title="Profile & Settings"
        description="Manage your account details, appearance, and security preferences"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <div className="glass-card p-6">
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #9A1750, #EE4C7C)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 22,
              marginBottom: 16,
            }}
          >
            AU
          </div>
          <div className="flex items-center gap-2 mb-4">
            <UserRound style={{ color: 'var(--text-muted)', width: 18, height: 18 }} />
            <h2 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600 }}>Profile Details</h2>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  width: '100%',
                  outline: 'none',
                  fontSize: 14,
                }}
              />
            </div>

            <div className="space-y-1">
              <label style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Email address
              </label>
              <input
                type="email"
                readOnly
                value="admin@urbanmind.gov.in"
                style={{
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  width: '100%',
                  opacity: 0.8,
                  fontSize: 14,
                }}
              />
            </div>

            <div className="space-y-1">
              <label style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Role
              </label>
              <input
                type="text"
                readOnly
                value="Admin Officer"
                style={{
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  width: '100%',
                  opacity: 0.8,
                  fontSize: 14,
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #9A1750, #EE4C7C)',
                color: '#FFFFFF',
                padding: '10px 20px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 16px rgba(154,23,80,0.30)',
              }}
            >
              {saved ? '✓ Saved' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound style={{ color: 'var(--text-muted)', width: 18, height: 18 }} />
            <h2 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600 }}>Security</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <label style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  width: '100%',
                  outline: 'none',
                  fontSize: 14,
                }}
              />
            </div>

            <div className="space-y-1">
              <label style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  width: '100%',
                  outline: 'none',
                  fontSize: 14,
                }}
              />
            </div>

            <div className="space-y-1">
              <label style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  width: '100%',
                  outline: 'none',
                  fontSize: 14,
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: 'var(--glass-hover)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                padding: '10px 20px',
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Appearance Card */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette style={{ color: 'var(--text-muted)', width: 18, height: 18 }} />
            <h2 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600 }}>Appearance</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 16 }}>
            Select your preferred color theme
          </p>
          {mounted && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 8,
                marginBottom: 16,
              }}
            >
              {[
                { id: 'dark', label: 'Dark', preview: 'dark' },
                { id: 'light', label: 'Light', preview: 'light' },
                { id: 'system', label: 'Auto', preview: 'system' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTheme(t.id)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    cursor: 'pointer',
                    border:
                      currentTheme === t.id
                        ? '1.5px solid #EE4C7C'
                        : '1px solid var(--glass-border)',
                    background:
                      currentTheme === t.id
                        ? 'rgba(154,23,80,0.12)'
                        : 'var(--glass)',
                    boxShadow:
                      currentTheme === t.id
                        ? '0 0 0 3px rgba(154,23,80,0.20)'
                        : 'none',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  {/* Mini preview */}
                  <div
                    style={{
                      height: 48,
                      borderRadius: 6,
                      marginBottom: 8,
                      overflow: 'hidden',
                      background:
                        t.id === 'dark'
                          ? '#121212'
                          : t.id === 'light'
                            ? '#E3E2DF'
                            : 'linear-gradient(135deg, #121212 50%, #E3E2DF 50%)',
                    }}
                  >
                    {t.id !== 'system' && (
                      <div style={{ padding: '8px 10px' }}>
                        <div
                          style={{
                            height: 6,
                            width: '60%',
                            borderRadius: 3,
                            background:
                              t.id === 'dark'
                                ? 'rgba(255,255,255,0.3)'
                                : 'rgba(0,0,0,0.25)',
                            marginBottom: 6,
                          }}
                        />
                        <div
                          style={{
                            height: 4,
                            width: '40%',
                            borderRadius: 2,
                            background:
                              t.id === 'dark'
                                ? 'rgba(255,255,255,0.15)'
                                : 'rgba(0,0,0,0.12)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color:
                        currentTheme === t.id
                          ? '#EE4C7C'
                          : 'var(--text-secondary)',
                    }}
                  >
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Session Card */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <LogOut style={{ color: 'var(--text-muted)', width: 18, height: 18 }} />
            <h2 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600 }}>Session</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
            Currently signed in as {name}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              background: 'rgba(154,23,80,0.12)',
              border: '1px solid rgba(154,23,80,0.30)',
              color: '#EE4C7C',
              padding: '10px 18px',
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
