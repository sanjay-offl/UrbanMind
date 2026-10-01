'use client';

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export interface GeographyState {
  selectedState: string;
  setSelectedState: (state: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedWard: string;
  setSelectedWard: (ward: string) => void;
  resetGeography: () => void;
  geoBreadcrumb: { level: string; name: string }[];
}

const GeographyContext = createContext<GeographyState>({
  selectedState: 'all',
  setSelectedState: () => {},
  selectedDistrict: 'all',
  setSelectedDistrict: () => {},
  selectedCity: 'all',
  setSelectedCity: () => {},
  selectedWard: 'all',
  setSelectedWard: () => {},
  resetGeography: () => {},
  geoBreadcrumb: [{ level: 'National', name: 'India' }],
});

export const useGeography = () => useContext(GeographyContext);
export const useWard = () => useContext(GeographyContext);

export function wardIdFromSelection(selection: string): number | undefined {
  if (!selection || selection === 'all') return undefined;
  const match = /ward\s+(\d+)/i.exec(selection);
  return match ? parseInt(match[1], 10) : undefined;
}

export function WardProvider({ children }: { children: ReactNode }) {
  const [selectedState, setSelectedState] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedWard, setSelectedWard] = useState('all');

  const handleSetState = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('all');
    setSelectedCity('all');
    setSelectedWard('all');
  };

  const handleSetDistrict = (district: string) => {
    setSelectedDistrict(district);
    setSelectedCity('all');
    setSelectedWard('all');
  };

  const resetGeography = () => {
    setSelectedState('all');
    setSelectedDistrict('all');
    setSelectedCity('all');
    setSelectedWard('all');
  };

  const geoBreadcrumb = useMemo(() => {
    const list: { level: string; name: string }[] = [{ level: 'National', name: 'India' }];
    if (selectedState && selectedState !== 'all') {
      list.push({ level: 'State', name: selectedState });
    }
    if (selectedDistrict && selectedDistrict !== 'all') {
      list.push({ level: 'District', name: selectedDistrict });
    }
    if (selectedCity && selectedCity !== 'all') {
      list.push({ level: 'City', name: selectedCity });
    }
    if (selectedWard && selectedWard !== 'all') {
      list.push({ level: 'Ward', name: selectedWard });
    }
    return list;
  }, [selectedState, selectedDistrict, selectedCity, selectedWard]);

  return (
    <GeographyContext.Provider
      value={{
        selectedState,
        setSelectedState: handleSetState,
        selectedDistrict,
        setSelectedDistrict: handleSetDistrict,
        selectedCity,
        setSelectedCity,
        selectedWard,
        setSelectedWard,
        resetGeography,
        geoBreadcrumb,
      }}
    >
      {children}
    </GeographyContext.Provider>
  );
}
