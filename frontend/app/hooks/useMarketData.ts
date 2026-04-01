'use client';

import { useState, useEffect } from 'react';

export interface MarketPair {
  symbol: string;
  displaySymbol: string;
  name: string;
  price: number;
  change: number;
  icon: string;
  vol?: number;
}

import api from '../lib/api';

export function useMarketData() {
  const [marketPairs, setMarketPairs] = useState<MarketPair[]>([]);
  const [metal, setMetal] = useState<MarketPair[]>([]);
  const [shares, setShares] = useState<MarketPair[]>([]);
  const [forex, setForex] = useState<MarketPair[]>([]);
  const [timeframes, setTimeframes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Define helper first
        const fetchProxyData = async (list: any[], icon: string) => {
            const promises = list.map(async (p: any) => {
                try {
                    const res = await api.get(`/market/proxy?symbol=${encodeURIComponent(p.symbol)}`);
                    return {
                        symbol: p.symbol.replace('/', ''),
                        displaySymbol: p.symbol,
                        name: p.symbol,
                        price: res.data.price,
                        change: res.data.changePercent,
                        icon: p.logo || icon,
                        vol: 1000 + Math.random() * 500 // Mock vol
                    };
                } catch (e) {
                    return {
                        symbol: p.symbol.replace('/', ''),
                        displaySymbol: p.symbol,
                        name: p.symbol,
                        price: 0,
                        change: 0,
                        icon: p.logo || icon,
                        vol: 0
                    };
                }
            });
            return Promise.all(promises);
        };

        // 1. Fetch Config from Backend
        const configRes = await api.get('/binary/config');
        const pairs = configRes.data.data[0].list;
        const times = configRes.data.data[0].times;
        setTimeframes(times);
        
        // 2. Separate by Category
        const cryptoPairs = pairs.filter((p: any) => p.category === 'crypto');
        const metalPairs = pairs.filter((p: any) => p.category === 'metal');
        const stockPairs = pairs.filter((p: any) => p.category === 'stock');
        const forexPairs = pairs.filter((p: any) => p.category === 'forex');

        // 3. Fetch Live Prices for Crypto (Binance Proxy)
        const priceRes = await api.get('/market/prices');
        const priceData = priceRes.data;

        // 4. Map Crypto
        if (Array.isArray(priceData)) {
            // First pass: try Binance data
            const mappedCrypto = cryptoPairs.map((p: any) => {
                const binanceSymbol = p.symbol.replace('/', '');
                const ticker = priceData.find((d: any) => d.symbol === binanceSymbol);
                
                // Fix Display Symbol for merged pairs (BNBUSDT -> BNB)
                // If it contains '/', use first part.
                // If it ends with 'USDT' (and is not just 'USDT'), strip it.
                // Otherwise keep as is.
                let display = p.symbol;
                if (display.includes('/')) {
                    display = display.split('/')[0];
                } else if (display.endsWith('USDT') && display.length > 4) {
                    display = display.replace('USDT', '');
                }

                return {
                    symbol: binanceSymbol, 
                    displaySymbol: display,
                    name: p.symbol,
                    price: ticker ? parseFloat(ticker.lastPrice) : 0,
                    change: ticker ? parseFloat(ticker.priceChangePercent) : 0,
                    icon: p.logo || '🪙', 
                    vol: ticker ? parseFloat(ticker.volume) : 0,
                    missing: !ticker // Flag to fetch from proxy
                };
            });

            // Second pass: fetch missing from proxy
            const missing = mappedCrypto.filter((c: any) => c.missing);
            if (missing.length > 0) {
                // Fetch proxy for missing
                const proxyData = await fetchProxyData(missing, '🪙');
                // Merge only price data, keeping metadata (icon, displaySymbol) from first pass
                const merged = mappedCrypto.map((c: any) => {
                    if (c.missing) {
                        const p = proxyData.find((pd: any) => pd.symbol === c.symbol);
                        // Only update price fields
                        return p ? { 
                            ...c, 
                            price: p.price, 
                            change: p.change, 
                            vol: p.vol, 
                            missing: false 
                        } : c;
                    }
                    return c;
                });
                setMarketPairs(merged);
            } else {
                setMarketPairs(mappedCrypto);
            }
        }

        // 5. Map Others (Mock Prices as Binance doesn't provide them freely/easily via same endpoint usually)
        // Now using Backend Proxy to simulate "Live" data or fetch real if connected
        
        const metalData = await fetchProxyData(metalPairs, 'G');
        setMetal(metalData);
        
        const stockData = await fetchProxyData(stockPairs, 'S');
        setShares(stockData);
        
        const forexData = await fetchProxyData(forexPairs, '£');
        setForex(forexData);
        
      } catch (e) {
        console.error("Failed to fetch market data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return { marketPairs, metal, shares, forex, timeframes, loading };
}
