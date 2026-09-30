'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEMO_USERS as CONST_DEMO_USERS, ROLE_PERMISSIONS, type Role } from './constants';

export interface AuthUser {
  email: string;
  name: string;
  role: Role;
  initials: string;
  department: string;
  ward: string | null;
  badgeLabel?: string;
}

export type User = AuthUser;

export const DEMO_USERS = CONST_DEMO_USERS;

const USER_STORAGE_KEY = 'urbanmind-user';
const TOKEN_STORAGE_KEY = 'urbanmind-token';
const NAME_STORAGE_KEY = 'user_name';

export class AuthError extends Error {}

function safeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Signs in against `/api/auth/session`, which verifies the credentials and
 * returns an HMAC-signed token. The token — not the browser copy of the role —
 * is what the API routes authorise against.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const payload = (await res.json().catch(() => null)) as
    | { ok: true; data: { user: AuthUser; token: string } }
    | { ok: false; error: string }
    | null;

  if (!payload) {
    throw new AuthError('Could not reach the sign-in service. Check your connection and retry.');
  }
  if (!payload.ok) {
    throw new AuthError(payload.error);
  }

  const store = safeStorage();
  store?.setItem(USER_STORAGE_KEY, JSON.stringify(payload.data.user));
  store?.setItem(TOKEN_STORAGE_KEY, payload.data.token);
  store?.setItem(NAME_STORAGE_KEY, payload.data.user.name);
  window.dispatchEvent(new Event('urbanmind-auth-change'));
  return payload.data.user;
}

/**
 * Returns the stored user, or `null`.
 *
 * There is deliberately no fallback to `DEMO_USERS[0]`: an unauthenticated
 * visitor must always be routed to `/login`.
 */
export function getSession(): AuthUser | null {
  const store = safeStorage();
  if (!store) return null;
  try {
    const stored = store.getItem(USER_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as AuthUser;
    if (!parsed || typeof parsed.email !== 'string' || !ROLE_PERMISSIONS[parsed.role]) {
      store.removeItem(USER_STORAGE_KEY);
      store.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** The bearer token for authenticated API calls, or null. */
export function getToken(): string | null {
  return safeStorage()?.getItem(TOKEN_STORAGE_KEY) ?? null;
}

export function isAuthenticated(): boolean {
  return getToken() !== null && getSession() !== null;
}

export function logout(): void {
  const store = safeStorage();
  store?.removeItem(USER_STORAGE_KEY);
  store?.removeItem(TOKEN_STORAGE_KEY);
  store?.removeItem(NAME_STORAGE_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('urbanmind-auth-change'));
  }
}

export function updateSession(user: AuthUser): void {
  const store = safeStorage();
  store?.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  store?.setItem(NAME_STORAGE_KEY, user.name);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('urbanmind-auth-change'));
  }
}

export function can(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setUser(getSession());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('urbanmind-auth-change', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('urbanmind-auth-change', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return {
    user,
    ready,
    can: (permission: string) => can(user, permission),
  };
}
