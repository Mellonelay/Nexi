'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActiveInstrument,
  DEFAULT_INSTRUMENT,
  findInstrument,
} from '../lib/instruments';

const STORAGE_KEY = 'dexi:active-instrument:v1';

interface ActivePairContextValue {
  activePair: ActiveInstrument;
  setActivePair: (instrument: ActiveInstrument) => void;
  setActivePairBySymbol: (symbol: string) => ActiveInstrument;
}

const ActivePairContext = createContext<ActivePairContextValue | null>(null);

export function ActivePairProvider({ children }: { readonly children: React.ReactNode }) {
  const [activePair, setActivePairState] = useState<ActiveInstrument>(DEFAULT_INSTRUMENT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ActiveInstrument>;
        const restored = findInstrument(parsed.canonicalSymbol ?? parsed.baseAsset);
        if (restored) setActivePairState(restored);
      }
    } catch (error) {
      console.warn('Unable to restore active instrument', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(activePair));
  }, [activePair, hydrated]);

  const setActivePair = useCallback((instrument: ActiveInstrument) => {
    setActivePairState(instrument);
  }, []);

  const setActivePairBySymbol = useCallback((symbol: string) => {
    const resolved = findInstrument(symbol) ?? DEFAULT_INSTRUMENT;
    setActivePairState(resolved);
    return resolved;
  }, []);

  const value = useMemo(
    () => ({ activePair, setActivePair, setActivePairBySymbol }),
    [activePair, setActivePair, setActivePairBySymbol],
  );

  return <ActivePairContext.Provider value={value}>{children}</ActivePairContext.Provider>;
}

export function useActivePair(): ActivePairContextValue {
  const context = useContext(ActivePairContext);
  if (!context) {
    throw new Error('useActivePair must be used inside ActivePairProvider');
  }
  return context;
}
