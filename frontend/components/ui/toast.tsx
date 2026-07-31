'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';
import { useTheme } from 'next-themes';

export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  const { theme } = useTheme();
  return <SonnerToaster theme={theme as 'dark' | 'light' | 'system' | undefined} {...props} />;
}

export { toast };
