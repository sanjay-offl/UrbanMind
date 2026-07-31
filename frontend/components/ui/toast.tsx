'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';
import { useTheme } from '@/components/theme-provider';

export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  const { theme } = useTheme();
  return <SonnerToaster theme={theme} {...props} />;
}

export { toast };
