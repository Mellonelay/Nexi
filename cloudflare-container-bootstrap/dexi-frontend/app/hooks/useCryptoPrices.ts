'use client';

import { useEffect, useState } from 'react';
import api from '../lib/api';

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  icon: string;
}

const catalog: CryptoPrice[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: null, change: null, icon: 'BTC' },
  { symbol: 'ETH', name: 'Ethereum', price: null, change: null, icon: 'ETH' },
  { symbol: 'LTC', name: 'Litecoin', price: null, change: null, icon: 'LTC' },
  { symbol: 'XRP', name: 'XRP', price: null, change: null, icon: 'XRP' },
  { symbol: 'BCH', name: 'Bitcoin Cash', price: null, change: null, icon: 'BCH' },
];

export function useCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrice[]>(catalog);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPrices = async () => {
      try {
        const response = await api.get('/market/prices');
        const rows = Array.isArray(response.data) ? response.data : [];
        if (cancelled) return;

        setPrices(catalog.map((coin) => {
          const ticker = rows.find((row: unknown) => (
            row && typeof row === 'object'
            && String((row as Record<string, unknown>).symbol).toUpperCase() === `${coin.symbol}USDT`
          )) as Record<string, unknown> | undefined;
          const price = Number(ticker?.lastPrice);
          const change = Number(ticker?.priceChangePercent);
          return {
            ...coin,
            price: Number.isFinite(price) && price > 0 ? price : null,
            change: Number.isFinite(change) ? change : null,
          };
        }));
      } catch {
        if (!cancelled) setPrices(catalog);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPrices();
    return () => {
      cancelled = true;
    };
  }, []);

  return { prices, loading };
}
