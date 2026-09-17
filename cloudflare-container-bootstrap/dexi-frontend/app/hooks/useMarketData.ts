'use client';

import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { io } from 'socket.io-client';
import { apiBaseUrl } from '../lib/api';
import { applyMarketSnapshot, applyMarketTick, marketCatalog } from '../lib/market-catalog';
export type { MarketPair } from '../lib/market-catalog';

type MarketDataValue = {
  marketPairs: ReturnType<typeof marketCatalog>;
  metal: ReturnType<typeof marketCatalog>;
  shares: ReturnType<typeof marketCatalog>;
  forex: ReturnType<typeof marketCatalog>;
  loading: boolean;
  error: boolean;
};

const MarketDataContext = createContext<MarketDataValue | null>(null);

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState(() => marketCatalog());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch('/api/market/prices', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Market prices unavailable');
        const data: unknown = await response.json();
        if (!controller.signal.aborted) {
          setPrices((current) => applyMarketSnapshot(current, data, response.headers.get('x-nexi-market-source')));
          setError(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setPrices(marketCatalog());
          setError(true);
        }
      } finally {
        pending = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 15_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!apiBaseUrl) return;
    const socket = io(`${apiBaseUrl}/market`, {
      transports: ['polling', 'websocket'],
      tryAllTransports: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
      reconnectionDelayMax: 8_000,
    });
    const handleSnapshot = (payload: unknown) => {
      setPrices((current) => applyMarketSnapshot(current, payload));
      setError(false);
    };
    const handleTick = (payload: unknown) => {
      setPrices((current) => applyMarketTick(current, payload));
    };
    socket.on('market_snapshot', handleSnapshot);
    socket.on('market_tick', handleTick);
    return () => {
      socket.off('market_snapshot', handleSnapshot);
      socket.off('market_tick', handleTick);
      socket.disconnect();
    };
  }, []);

  const value = useMemo(() => ({
    marketPairs: prices.filter((item) => item.category === 'Crypto'),
    metal: prices.filter((item) => item.category === 'Metals'),
    shares: prices.filter((item) => item.category === 'Stocks'),
    forex: prices.filter((item) => item.category === 'Forex'),
    loading, error,
  }), [prices, loading, error]);

  return createElement(MarketDataContext.Provider, { value }, children);
}

export function useMarketData() {
  const value = useContext(MarketDataContext);
  if (!value) throw new Error('useMarketData must be used inside MarketDataProvider');
  return value;
}
