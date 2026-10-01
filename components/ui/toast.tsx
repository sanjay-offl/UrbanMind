'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';
import { useTheme } from 'next-themes';

export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  const { theme } = useTheme();
  return (
    <SonnerToaster
      theme={theme as 'dark' | 'light' | 'system' | undefined}
      position="bottom-right"
      gap={8}
      toastOptions={{
        style: {
          background: 'var(--navbar-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          padding: '14px 18px',
          minWidth: '280px',
          maxWidth: '380px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--text-primary)',
          animation: 'toastIn 250ms cubic-bezier(0.4,0,0.2,1)',
        },
      }}
      {...props}
    />
  );
}

export { toast };
