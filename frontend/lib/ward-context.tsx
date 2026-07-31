'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type WardContextType = {
  selectedWard: string;
  setSelectedWard: (ward: string) => void;
};

const WardContext = createContext<WardContextType>({
  selectedWard: 'all',
  setSelectedWard: () => {},
});

export const useWard = () => useContext(WardContext);

export function WardProvider({ children }: { children: ReactNode }) {
  const [selectedWard, setSelectedWard] = useState('all');

  return (
    <WardContext.Provider value={{ selectedWard, setSelectedWard }}>
      {children}
    </WardContext.Provider>
  );
}
