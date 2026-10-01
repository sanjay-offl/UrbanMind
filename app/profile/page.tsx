'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRound, KeyRound, LogOut, CheckCircle2 } from 'lucide-react';
import { getSession, logout } from '@/lib/auth';
import PageHeader from '@/components/layout/page-header';
import { toast } from '@/components/ui/toast';

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState('Administrator');
  const [email, setEmail] = useState('admin@urbanmind.gov.in');
  const [role, setRole] = useState('National Admin');
  const [saved, setSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const session = getSession();
    if (session) {
      if (session.name) setName(session.name);
      if (session.email) setEmail(session.email);
      if (session.role) {
        setRole(
          session.role === 'admin'
            ? 'National Admin'
            : (session.role as string) === 'ward_officer' || (session.role as string) === 'ward'
            ? 'Ward Officer'
            : 'Policy Analyst'
        );
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    toast.success('Profile details saved successfully');
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
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
    toast.success('Password updated successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSignOut = () => {
    logout();
    toast.success('Signed out');
    router.replace('/login');
  };

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Profile & Account"
        description="Manage your officer credentials, jurisdiction role, and security access"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <div className="civic-panel space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1A73E8] text-base font-bold text-white">
              {initials}
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#202124]">{name}</h2>
              <p className="text-xs text-[#5F6368]">{role}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
                Email address
              </label>
              <input
                type="email"
                readOnly
                value={email}
                className="w-full bg-[#F8FAFC] text-[#5F6368]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
                Role & Jurisdiction Scope
              </label>
              <input
                type="text"
                readOnly
                value={role}
                className="w-full bg-[#F8FAFC] text-[#5F6368]"
              />
            </div>

            <button type="submit" className="btn-primary">
              {saved ? (
                <>
                  <CheckCircle2 size={16} /> Saved
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="civic-panel space-y-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#4285F4]" />
            <h2 className="text-base font-semibold text-[#202124]">Security & Authentication</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="submit" className="btn-secondary">
                Update password
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA4335] hover:underline"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
