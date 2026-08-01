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

function ThemeSync({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    const saved = localStorage.getItem('urbanmind-theme') || 'dark';
    applyTheme(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyTheme(next: string) {
    setTheme(next);
    localStorage.setItem('urbanmind-theme', next);

    if (next === 'system') {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      document.documentElement.setAttribute(
        'data-theme',
        prefersDark ? 'dark' : 'light'
      );
    } else {
      document.documentElement.setAttribute('data-theme', next);
    }
  }

  const value = React.useMemo(
    () => ({ theme: theme ?? 'dark', applyTheme }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      <ThemeSync>{children}</ThemeSync>
    </NextThemesProvider>
  );
}
