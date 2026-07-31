'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = 'urbanmind-theme';

const DARK_LOGO = '/urbanmind_dark_logo.png';
const LIGHT_LOGO = '/urbanmind_light_logo.png';

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveSystem(prefersDark: boolean): ResolvedTheme {
  return prefersDark ? 'dark' : 'light';
}

function applyClass(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
}

function swapLogos(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  const logos = document.querySelectorAll<HTMLImageElement>('.um-logo');
  logos.forEach((logo) => {
    logo.style.opacity = '0';
    setTimeout(() => {
      logo.src = theme === 'light' ? LIGHT_LOGO : DARK_LOGO;
      logo.style.opacity = '1';
    }, 150);
  });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  useEffect(() => {
    const stored = (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? 'dark';
    let resolved: ResolvedTheme;
    if (stored === 'system') {
      resolved = resolveSystem(systemPrefersDark());
    } else {
      resolved = stored;
    }
    setThemeState(stored);
    setResolvedTheme(resolved);
    applyClass(resolved);
    swapLogos(resolved);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    let resolved: ResolvedTheme;
    if (next === 'system') {
      resolved = resolveSystem(systemPrefersDark());
    } else {
      resolved = next;
    }
    setThemeState(next);
    setResolvedTheme(resolved);
    applyClass(resolved);
    swapLogos(resolved);
    localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      const resolved = resolveSystem(e.matches);
      setResolvedTheme(resolved);
      applyClass(resolved);
      swapLogos(resolved);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
