'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';

interface ThemeContextValue {
  theme: string;
  applyTheme: (theme: string) => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: 'dark',
  applyTheme: () => {},
});

export function useThemeController(): ThemeContextValue {
  return React.useContext(ThemeContext);
}

/**
 * Resolves a next-themes value to the theme actually painted by globals.css.
 * globals.css keys off `[data-theme]`, so that is the single source of truth
 * — the legacy `.dark` / `.light` class attribute is no longer written.
 */
export function resolveDataTheme(next: string): string {
  if (next !== 'system') return next;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function ThemeSync({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const [resolved, setResolved] = React.useState('light');

  const applyTheme = React.useCallback(
    (next: string) => {
      setTheme(next);
      try {
        localStorage.setItem('urbanmind-theme', next);
      } catch {
        /* storage unavailable — non-fatal */
      }
      const dataTheme = resolveDataTheme(next);
      setResolved(dataTheme);
      document.documentElement.setAttribute('data-theme', dataTheme);
    },
    [setTheme]
  );

  React.useEffect(() => {
    let saved = 'light';
    try {
      saved = localStorage.getItem('urbanmind-theme') || 'light';
    } catch {
      /* storage unavailable — fall back to light */
    }
    applyTheme(saved);

    if (saved !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [applyTheme]);

  const value = React.useMemo(
    () => ({ theme: resolved, applyTheme }),
    [resolved, applyTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      <ThemeSync>{children}</ThemeSync>
    </NextThemesProvider>
  );
}
