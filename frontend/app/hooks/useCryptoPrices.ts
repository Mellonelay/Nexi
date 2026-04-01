'use client';

import { useState, useEffect } from 'react';

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  icon: string;
}

export function useCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrice[]>([
    { symbol: 'BTC', name: 'Bitcoin', price: 0, change: 0, icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', price: 0, change: 0, icon: 'Ξ' },
    { symbol: 'LTC', name: 'Litecoin', price: 0, change: 0, icon: 'Ł' },
    { symbol: 'XRP', name: 'Ripple', price: 0, change: 0, icon: '✕' },
    { symbol: 'BCH', name: 'Bitcoin Cash', price: 0, change: 0, icon: '฿' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const symbols = [
          { symbol: 'BTCUSDT', name: 'Bitcoin', displaySymbol: 'BTC', icon: '₿' },
          { symbol: 'ETHUSDT', name: 'Ethereum', displaySymbol: 'ETH', icon: 'Ξ' },
          { symbol: 'LTCUSDT', name: 'Litecoin', displaySymbol: 'LTC', icon: 'Ł' },
          { symbol: 'XRPUSDT', name: 'Ripple', displaySymbol: 'XRP', icon: '✕' },
          { symbol: 'BCHUSDT', name: 'Bitcoin Cash', displaySymbol: 'BCH', icon: '฿' },
        ];

        const pricePromises = symbols.map(async (coin) => {
          try {
            const tickerResponse = await fetch(
              `https://api.binance.com/api/v3/ticker/24hr?symbol=${coin.symbol}`
            );
            
            if (!tickerResponse.ok) {
              throw new Error(`Failed to fetch ${coin.symbol}`);
            }

            const tickerData = await tickerResponse.json();
            
            return {
              symbol: coin.displaySymbol,
              name: coin.name,
              price: parseFloat(tickerData.lastPrice),
              change: parseFloat(tickerData.priceChangePercent),
              icon: coin.icon,
            };
          } catch (error) {
            console.error(`Error fetching ${coin.symbol}:`, error);
            return null;
          }
        });

        const results = await Promise.all(pricePromises);
        const validPrices = results.filter((p): p is CryptoPrice => p !== null);

        if (validPrices.length > 0) {
          console.log('Binance API prices:', validPrices);
          setPrices(validPrices);
          setLoading(false);
        } else {
          throw new Error('No valid prices fetched');
        }
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
        const fallbackPrices: CryptoPrice[] = [
          { symbol: 'BTC', name: 'Bitcoin', price: 102500, change: 2.5, icon: '₿' },
          { symbol: 'ETH', name: 'Ethereum', price: 3850, change: 1.8, icon: 'Ξ' },
          { symbol: 'LTC', name: 'Litecoin', price: 125, change: -0.5, icon: 'Ł' },
          { symbol: 'XRP', name: 'Ripple', price: 2.85, change: 3.2, icon: '✕' },
          { symbol: 'BCH', name: 'Bitcoin Cash', price: 485, change: -1.2, icon: '฿' },
        ];
        setPrices(fallbackPrices);
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);

    return () => clearInterval(interval);
  }, []);

  return { prices, loading };
}
