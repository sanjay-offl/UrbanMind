'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const active = value ?? internal;

  const ctx = React.useMemo(
    () => ({
      active,
      setActive: (next: string) => {
        setInternal(next);
        onValueChange?.(next);
      },
    }),
    [active, onValueChange]
  );

  return <TabsContext.Provider value={ctx}>{children}</TabsContext.Provider>;
}

interface TabsContextValue {
  active: string;
  setActive: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({
  active: '',
  setActive: () => undefined,
});

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { active, setActive } = React.useContext(TabsContext);
  const isActive = active === value;

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        isActive
          ? 'bg-background text-foreground shadow'
          : 'hover:text-foreground',
        className
      )}
      onClick={() => setActive(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { active } = React.useContext(TabsContext);
  if (active !== value) return null;
  return <div className={cn('mt-2', className)}>{children}</div>;
}
