'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return <SonnerToaster theme="light" {...props} />;
}

export { toast };
