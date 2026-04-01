'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, UTCTimestamp } from 'lightweight-charts';

interface TradingChartProps {
  symbol: string;
  type: 'binary' | 'spot';
  interval?: string;
}

export default function TradingChart({ symbol, type, interval = '1m' }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Helper to determine if symbol is a Binance pair (Crypto)
  const isCrypto = (s: string) => !s.includes('.') && !s.includes('USD') || s.endsWith('USDT');
  
  const cleanSymbol = symbol.replace('/', '').toUpperCase();
  const isBinanceSymbol = isCrypto(cleanSymbol);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // ... (Chart creation code remains same, I will use a broader search/replace to wrap useEffect content if needed, but here I can just update the loadData logic and dependencies)
    // Actually, creating the chart every time interval changes is wasteful but safe. 
    // Ideally, I should separate chart creation from data loading.
    // For simplicity given the tool, I'll keep the effect structure but ensure it re-runs on [symbol, interval].

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { visible: false, color: '#1e293b' },
        horzLines: { visible: false, color: '#1e293b' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#1e293b',
      },
      rightPriceScale: {
        borderColor: '#1e293b',
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00C076',
      downColor: '#FF4D4F',
      borderVisible: false,
      wickUpColor: '#00C076',
      wickDownColor: '#FF4D4F',
    });
    candleSeriesRef.current = candlestickSeries;

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '', 
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    const loadData = async () => {
      if (isBinanceSymbol) {
        try {
          const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${cleanSymbol}&interval=${interval}&limit=200`);
          const raw = await res.json();
          
          if (Array.isArray(raw)) {
            const data = raw.map((d: any) => ({
              time: (d[0] / 1000) as UTCTimestamp,
              open: Number.parseFloat(d[1]),
              high: Number.parseFloat(d[2]),
              low: Number.parseFloat(d[3]),
              close: Number.parseFloat(d[4]),
            }));
            
            const volData = raw.map((d: any) => ({
              time: (d[0] / 1000) as UTCTimestamp,
              value: Number.parseFloat(d[5]),
              color: Number.parseFloat(d[4]) >= Number.parseFloat(d[1]) ? 'rgba(0, 192, 118, 0.5)' : 'rgba(255, 77, 79, 0.5)',
            }));

            candlestickSeries.setData(data);
            volumeSeries.setData(volData);
            
            // Connect WS
            if (wsRef.current) wsRef.current.close();
            const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${cleanSymbol.toLowerCase()}@kline_${interval}`);
            wsRef.current = ws;
            
            ws.onmessage = (event) => {
              const msg = JSON.parse(event.data);
              if (msg.e === 'kline') {
                const k = msg.k;
                const candle = {
                  time: (k.t / 1000) as UTCTimestamp,
                  open: Number.parseFloat(k.o),
                  high: Number.parseFloat(k.h),
                  low: Number.parseFloat(k.l),
                  close: Number.parseFloat(k.c),
                };
                const vol = {
                  time: (k.t / 1000) as UTCTimestamp,
                  value: Number.parseFloat(k.v),
                  color: Number.parseFloat(k.c) >= Number.parseFloat(k.o) ? 'rgba(0, 192, 118, 0.5)' : 'rgba(255, 77, 79, 0.5)',
                };
                candlestickSeries.update(candle as any);
                volumeSeries.update(vol as any);
              }
            };
          }
        } catch (err) {
            console.error('Failed to fetch binance data', err);
            generateMockData();
        }
      } else {
        generateMockData();
      }
    };

    const generateMockData = () => {
      // Mock logic for non-crypto
      const data = [];
      const volumeData = [];
      let basePrice = 150.00; // Generic base
      const now = Math.floor(Date.now() / 1000);
      const intervalSec = interval === '1m' ? 60 : interval === '5m' ? 300 : interval === '15m' ? 900 : interval === '1h' ? 3600 : 14400;

      for (let i = 100; i >= 0; i--) {
        const time = (now - i * intervalSec) as UTCTimestamp;
        const open = basePrice + (Math.random() - 0.5) * 1;
        const close = open + (Math.random() - 0.5) * 0.5;
        const high = Math.max(open, close) + Math.random() * 0.2;
        const low = Math.min(open, close) - Math.random() * 0.2;
        
        data.push({ time, open, high, low, close });
        volumeData.push({
          time,
          value: Math.random() * 1000,
          color: close >= open ? 'rgba(0, 192, 118, 0.5)' : 'rgba(255, 77, 79, 0.5)',
        });
        basePrice = close;
      }
      candlestickSeries.setData(data);
      volumeSeries.setData(volumeData);
    };

    loadData();
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) wsRef.current.close();
      chart.remove();
    };
  }, [symbol, interval]);

  return (
    <div className="relative w-full h-full">
      <div ref={chartContainerRef} className="w-full h-full rounded-lg overflow-hidden" />
    </div>
  );
}
