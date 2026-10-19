'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  ActiveInstrument,
  createActiveInstrument,
  defaultActiveInstrument,
  instrumentFromPair,
  normalizePair,
} from './active-instrument';

type ActiveInstrumentContextValue = {
  activeInstrument: ActiveInstrument;
  setActiveInstrument: (instrument: ActiveInstrument) => void;
  setActivePair: (pair: string) => void;
};

const ActiveInstrumentContext = createContext<ActiveInstrumentContextValue | null>(null);

export function ActivePairProvider({ children }: { children: React.ReactNode }) {
  const [activeInstrument, setActiveInstrumentState] = useState(defaultActiveInstrument);

  const setActiveInstrument = useCallback((instrument: ActiveInstrument) => {
    setActiveInstrumentState(createActiveInstrument(instrument));
  }, []);

  const setActivePair = useCallback((pair: string) => {
    const normalized = normalizePair(pair);
    if (!normalized) return;
    setActiveInstrumentState((current) => (
      normalizePair(current.pair) === normalized
        ? current
        : instrumentFromPair(normalized)
    ));
  }, []);

  const value = useMemo(() => ({ activeInstrument, setActiveInstrument, setActivePair }), [activeInstrument, setActiveInstrument, setActivePair]);

  return (
    <ActiveInstrumentContext.Provider value={value}>
      {children}
    </ActiveInstrumentContext.Provider>
  );
}

export function useActiveInstrument() {
  const context = useContext(ActiveInstrumentContext);
  if (!context) throw new Error('useActiveInstrument must be used inside ActivePairProvider');
  return context;
}

export function useActivePair() {
  const { activeInstrument, setActivePair } = useActiveInstrument();
  return {
    activePair: normalizePair(activeInstrument.pair),
    setActivePair,
  };
}
