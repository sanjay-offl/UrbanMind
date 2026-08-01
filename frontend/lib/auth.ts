'use client';

import { useEffect, useState } from 'react';
import { DEMO_USERS as CONST_DEMO_USERS, ROLE_PERMISSIONS, type Role } from './constants';

export interface AuthUser {
  email: string;
  name: string;
  role: Role;
  initials: string;
  department: string;
  ward: string | null;
}

export type User = AuthUser;

export const DEMO_USERS = CONST_DEMO_USERS;

export const DEMO_CREDENTIALS = {
  email: DEMO_USERS[0].email,
  password: DEMO_USERS[0].password,
  name: DEMO_USERS[0].name,
  role: DEMO_USERS[0].role,
};

const USER_STORAGE_KEY = 'urbanmind-user';

export function login(email: string, password: string): AuthUser | null {
  const match = DEMO_USERS.find(
    (u) =>
      u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
      u.password === password
  );
  if (!match) return null;

  const user: AuthUser = {
    email: match.email,
    name: match.name,
    role: match.role,
    initials: match.initials,
    department: match.department,
    ward: match.ward,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('user_name', user.name);
    window.dispatchEvent(new Event('urbanmind-auth-change'));
  }
  return user;
}

export function getSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as AuthUser;
    // Default fallback to Admin if none stored
    const defaultAdmin: AuthUser = {
      email: DEMO_USERS[0].email,
      name: DEMO_USERS[0].name,
      role: DEMO_USERS[0].role,
      initials: DEMO_USERS[0].initials,
      department: DEMO_USERS[0].department,
      ward: DEMO_USERS[0].ward,
    };
    return defaultAdmin;
  } catch {
    return null;
  }
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('user_name');
    window.dispatchEvent(new Event('urbanmind-auth-change'));
  }
}

export function updateSession(user: AuthUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('user_name', user.name);
    window.dispatchEvent(new Event('urbanmind-auth-change'));
  }
}

export function verifyPassword(password: string): boolean {
  return password === DEMO_CREDENTIALS.password;
}

export function can(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getSession());

    function handleAuthChange() {
      setUser(getSession());
    }

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('urbanmind-auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('urbanmind-auth-change', handleAuthChange);
    };
  }, []);

  return { user, can: (permission: string) => can(user, permission) };
}
