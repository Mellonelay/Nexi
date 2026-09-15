'use client';

import { useEffect, useMemo, useState } from 'react';
import { marketCatalog } from '../lib/market-catalog';
export type { MarketPair } from '../lib/market-catalog';

export function useMarketData() {
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
          setPrices(marketCatalog(data, response.headers.get('x-nexi-market-source')));
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

  return useMemo(() => ({
    marketPairs: prices.filter((item) => item.category === 'Crypto'),
    metal: prices.filter((item) => item.category === 'Metals'),
    shares: prices.filter((item) => item.category === 'Stocks'),
    forex: prices.filter((item) => item.category === 'Forex'),
    loading, error,
  }), [prices, loading, error]);
}
